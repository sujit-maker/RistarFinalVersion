import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEmptyRepoJobDto } from './dto/create-emptyRepoJob.dto';
import { UpdateEmptyRepoJobDto } from './dto/update-emptyRepoJob.dto';

@Injectable()
export class EmptyRepoJobService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateJobNumber(polCode: string, podCode: string): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `RST/${polCode}${podCode}/${year}/`;

    const latestJob = await this.prisma.emptyRepoJob.findFirst({
      where: {
        jobNumber: { startsWith: `${prefix}ER` },
      },
      orderBy: { jobNumber: 'desc' },
    });

    let nextSeq = 1;
    if (latestJob?.jobNumber) {
      const parts = latestJob.jobNumber.split('/');
      if (parts.length >= 4) {
        const seqPart = parts[3].replace('ER', '');
        const lastSeq = parseInt(seqPart, 10);
        if (!isNaN(lastSeq)) {
          nextSeq = lastSeq + 1;
        }
      }
    }

    const paddedSeq = String(nextSeq).padStart(5, '0');
    return `${prefix}ER${paddedSeq}`;
  }

  /**
   * Preview-only: returns a dummy job number template
   */
 async getNextJobNumber(): Promise<{ jobNumber: string; houseBL: string }> {
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `RST/`; // Match all RST/XXYYZZ/25/ER000xx patterns

  const jobs = await this.prisma.emptyRepoJob.findMany({
    where: {
      jobNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      jobNumber: 'desc',
    },
  });

  let maxSeq = 0;

  for (const job of jobs) {
    const parts = job.jobNumber.split('/');
    if (parts.length === 4 && parts[3].startsWith('ER')) {
      const seq = parseInt(parts[3].replace('ER', ''), 10);
      if (!isNaN(seq)) {
        maxSeq = Math.max(maxSeq, seq);
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const paddedSeq = String(nextSeq).padStart(5, '0');
  const placeholderPrefix = `RST/[POL][POD]/${year}/`;

  const jobNumber = `${placeholderPrefix}ER${paddedSeq}`;

  return {
    jobNumber,
    houseBL: jobNumber,
  };
}


  async create(data: CreateEmptyRepoJobDto) {
    const { containers, polPortId, podPortId, ...jobData } = data;

    if (!polPortId || !podPortId) {
      throw new Error('polPortId and podPortId are required');
    }

    const [polPort, podPort] = await Promise.all([
      this.prisma.ports.findUnique({ where: { id: polPortId } }),
      this.prisma.ports.findUnique({ where: { id: podPortId } }),
    ]);

    if (!polPort || !podPort) {
      throw new Error('Invalid port IDs provided');
    }

    const jobNumber = await this.generateJobNumber(polPort.portCode, podPort.portCode);
    const houseBL = jobNumber;

    const parseDate = (d: string | Date | undefined) =>
      d ? new Date(d).toISOString() : new Date().toISOString();

    return this.prisma.$transaction(async (tx) => {
      const jobDataForCreate: any = {
        ...jobData,
        jobNumber,
        houseBL,
        polPortId,
        podPortId,
        date: parseDate(jobData.date),
        gsDate: parseDate(jobData.gsDate),
        etaTopod: parseDate(jobData.etaTopod),
        estimateDate: parseDate(jobData.estimateDate),
      };

      if (jobData.sob) {
        jobDataForCreate.sob = new Date(jobData.sob).toISOString();
      }

      const createdJob = await tx.emptyRepoJob.create({
        data: jobDataForCreate,
      });

      // Create containers
      if (containers && containers.length > 0) {
        await tx.repoShipmentContainer.createMany({
          data: containers.map((c) => ({
            shipmentId: createdJob.id,
            containerNumber: c.containerNumber,
            capacity: c.capacity,
            tare: c.tare,
            portId: c.portId,
            inventoryId: c.inventoryId,
            depotName: c.depotName,
          })),
        });

        for (const container of containers) {
          const inventory = await tx.inventory.findFirst({
            where: { containerNumber: container.containerNumber },
          });

          if (inventory) {
            const leasingInfo = await tx.leasingInfo.findFirst({
              where: { inventoryId: inventory.id },
              orderBy: { createdAt: 'desc' },
            });

            if (leasingInfo) {
              await tx.movementHistory.create({
                data: {
                  inventoryId: inventory.id,
                  portId: leasingInfo.portId,
                  addressBookId: leasingInfo.onHireDepotaddressbookId,
                  emptyRepoJobId: createdJob.id,
                  status: 'ALLOTTED',
                  date: new Date(),
                },
              });
            }
          }
        }
      }

      return createdJob;
    });
  }

  async update(id: number, data: UpdateEmptyRepoJobDto) {
    const { containers, polPortId, podPortId, ...jobData } = data;

    return this.prisma.$transaction(async (tx) => {
      const existingJob = await tx.emptyRepoJob.findUnique({ where: { id } });
      if (!existingJob) throw new Error('Job not found');

      const updatedPolPortId = polPortId ?? existingJob.polPortId;
      const updatedPodPortId = podPortId ?? existingJob.podPortId;

      const [polPort, podPort] = await Promise.all([
        tx.ports.findUnique({ where: { id: updatedPolPortId ?? undefined } }),
        tx.ports.findUnique({ where: { id: updatedPodPortId ?? undefined } }),
      ]);

      if (!polPort || !podPort) throw new Error('Invalid port IDs');

      let jobNumber = existingJob.jobNumber;
      const year = new Date().getFullYear().toString().slice(-2);
      const newPrefix = `RST/${polPort.portCode}${podPort.portCode}/${year}/`;

      if (!jobNumber.startsWith(newPrefix)) {
        jobNumber = await this.generateJobNumber(polPort.portCode, podPort.portCode);
      }

      const updatedJob = await tx.emptyRepoJob.update({
        where: { id },
        data: {
          ...jobData,
          jobNumber,
          houseBL: jobNumber,
          polPortId: updatedPolPortId,
          podPortId: updatedPodPortId,
          date: jobData.date ? new Date(jobData.date) : undefined,
          gsDate: jobData.gsDate ? new Date(jobData.gsDate) : undefined,
          sob: jobData.sob ? new Date(jobData.sob) : undefined,
          etaTopod: jobData.etaTopod ? new Date(jobData.etaTopod) : undefined,
          estimateDate: jobData.estimateDate
            ? new Date(jobData.estimateDate)
            : undefined,
        },
      });

      const existingContainers = await tx.repoShipmentContainer.findMany({
        where: { shipmentId: id },
      });

      await tx.repoShipmentContainer.deleteMany({
        where: { shipmentId: id },
      });

      const existingContainerNumbers = new Set(
        existingContainers.map((c) => c.containerNumber),
      );

      if (containers && containers.length > 0) {
        await tx.repoShipmentContainer.createMany({
          data: containers.map((container) => ({
            ...container,
            shipmentId: id,
          })),
        });

        for (const container of containers) {
          if (!existingContainerNumbers.has(container.containerNumber)) {
            const inventory = await tx.inventory.findFirst({
              where: { containerNumber: container.containerNumber },
            });

            if (inventory) {
              const leasingInfo = await tx.leasingInfo.findFirst({
                where: { inventoryId: inventory.id },
                orderBy: { createdAt: 'desc' },
              });

              if (leasingInfo) {
                await tx.movementHistory.create({
                  data: {
                    inventoryId: inventory.id,
                    portId: leasingInfo.portId,
                    addressBookId: leasingInfo.onHireDepotaddressbookId,
                    emptyRepoJobId: id,
                    status: 'ALLOTTED',
                    date: new Date(),
                  },
                });
              }
            }
          }
        }
      }

      return updatedJob;
    });
  }

  

  findAll() {
    return this.prisma.emptyRepoJob.findMany({
      include: {
        expHandlingAgentAddressBook: true,
        impHandlingAgentAddressBook: true,
        carrierAddressBook: true,
        emptyReturnDepotAddressBook: true,
        polPort: true,
        podPort: true,
        transhipmentPort: true,
        containers: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.emptyRepoJob.findUnique({
      where: { id },
      include: {
        expHandlingAgentAddressBook: true,
        impHandlingAgentAddressBook: true,
        carrierAddressBook: true,
        emptyReturnDepotAddressBook: true,
        polPort: true,
        podPort: true,
        transhipmentPort: true,
        containers: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.movementHistory.deleteMany({
        where: { emptyRepoJobId: id },
      });

      await tx.repoShipmentContainer.deleteMany({
        where: { shipmentId: id },
      });

      return tx.emptyRepoJob.delete({
        where: { id },
      });
    });
  }
}
