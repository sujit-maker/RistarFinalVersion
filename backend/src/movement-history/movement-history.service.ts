import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MovementHistory } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MovementHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.movementHistory.findMany({
      include: {
        inventory: true,
        port: true,
        addressBook: true,
        shipment: {
          select: {
            jobNumber: true,
            vesselName: true,
          },
        },
        emptyRepoJob: {
          select: {
            jobNumber: true,
            vesselName: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const movement = await this.prisma.movementHistory.findUnique({
      where: { id },
      include: {
        inventory: true,
        port: true,
        addressBook: true,
        shipment: true,
        emptyRepoJob: true,
      },
    });

    if (!movement) {
      throw new NotFoundException(`MovementHistory with ID ${id} not found`);
    }

    return movement;
  }

  async findAllExceptAvailable() {
    return this.prisma.movementHistory.findMany({
      where: {
        NOT: {
          status: 'AVAILABLE',
        },
      },
      include: {
        inventory: true,
        port: true,
        addressBook: true,
        shipment: true,
        emptyRepoJob: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  /**
   * Shared logic for handling status transitions
   */
  private async resolveStatusTransition(
    status: string,
    prev: MovementHistory,
    shipment?: any | null,
    emptyRepoJob?: any | null,
    addressBookIdFromFrontend?: number,
    remarks?: string,
    vesselName?: string,
  ) {
    let portId: number | null = prev.portId;
    let addressBookId: number | null =
      addressBookIdFromFrontend ?? prev.addressBookId ?? null;

    switch (status) {
      case 'EMPTY PICKED UP':
        portId =
          prev.portId ?? shipment?.polPortId ?? emptyRepoJob?.polPortId ?? null;
        addressBookId = prev.addressBookId ?? null;
        break;

      case 'LADEN GATE-IN':
      case 'EMPTY GATE-IN':
        if (emptyRepoJob) {
          status = 'EMPTY GATE-IN';
          portId = emptyRepoJob.polPortId!;
          addressBookId = null;
        } else {
          status = 'LADEN GATE-IN';
          portId = shipment?.polPortId ?? null;
          addressBookId = null;
        }
        break;

      case 'SOB':
        portId =
          shipment?.podPortId ??
          shipment?.polPortId ??
          emptyRepoJob?.podPortId ??
          emptyRepoJob?.polPortId ??
          null;
        addressBookId =
          addressBookIdFromFrontend ??
          shipment?.carrierAddressBookId ??
          emptyRepoJob?.carrierAddressBookId ??
          null;
        break;

      case 'LADEN DISCHARGE(ATA)':
        if (emptyRepoJob) {
          status = 'EMPTY DISCHARGE';
          portId = emptyRepoJob.podPortId ?? null;
        } else {
          status = 'LADEN DISCHARGE(ATA)';
          portId = shipment?.podPortId ?? null;
        }
        addressBookId = null;
        break;

      case 'EMPTY DISCHARGE': // ✅ allow frontend to send it directly
        status = 'EMPTY DISCHARGE';
        portId = emptyRepoJob?.podPortId ?? null;
        addressBookId = null;
        break;

      case 'EMPTY RETURNED':
        portId = shipment?.podPortId ?? emptyRepoJob?.podPortId ?? null;
        addressBookId =
          shipment?.emptyReturnDepotAddressBookId ??
          emptyRepoJob?.emptyReturnDepotAddressBookId ??
          null;
        break;

      case 'AVAILABLE':
      case 'UNAVAILABLE':
      case 'DAMAGED':
      case 'CANCELLED':
      case 'RETURNED TO DEPOT':
        if (!portId) portId = prev.portId;
        if (!addressBookId) addressBookId = prev.addressBookId;
        break;

      default:
        throw new BadRequestException(
          `Unsupported status transition: ${status}`,
        );
    }

    if (!portId) {
      throw new BadRequestException(
        `portId cannot be null or undefined for movement ID ${prev.id}`,
      );
    }

    return {
      portId,
      addressBookId,
      remarks: remarks?.trim() || null,
      vesselName: vesselName?.trim() || null,
      status, // return possibly updated status
    };
  }

  async bulkUpdateStatus(
    ids: number[],
    newStatus: string,
    jobNumber: string,
    remarks?: string,
    vesselName?: string,
    addressBookIdFromFrontend?: number,
  ) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { jobNumber },
      include: {
        polPort: true,
        podPort: true,
        carrierAddressBook: true,
      },
    });

    const emptyRepoJob = !shipment
      ? await this.prisma.emptyRepoJob.findFirst({
          where: { jobNumber },
          select: {
            id: true,
            polPortId: true,
            podPortId: true,
            carrierAddressBookId: true,
            emptyReturnDepotAddressBookId: true,
          },
        })
      : null;

    const status = newStatus.toUpperCase();

    const tasks = ids.map(async (id) => {
      const prev = await this.prisma.movementHistory.findUnique({
        where: { id },
      });
      if (!prev) throw new NotFoundException(`MovementHistory ${id} not found`);

      const {
        portId,
        addressBookId,
        remarks: finalRemarks,
        vesselName: finalVesselName,
        status: finalStatus,
      } = await this.resolveStatusTransition(
        status,
        prev,
        shipment,
        emptyRepoJob,
        addressBookIdFromFrontend,
        remarks,
        vesselName,
      );

      return this.prisma.movementHistory.create({
        data: {
          inventoryId: prev.inventoryId,
          shipmentId: prev.shipmentId ?? shipment?.id ?? null,
          emptyRepoJobId: prev.emptyRepoJobId ?? emptyRepoJob?.id ?? null,
          portId,
          addressBookId,
          status: finalStatus,
          date: new Date(),
          remarks: finalRemarks,
          vesselName: finalVesselName,
        },
      });
    });

    return this.prisma.$transaction(tasks as any);
  }

  async updateMovement(id: number, data: Partial<MovementHistory>) {
    const updatedData = {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    };

    return this.prisma.movementHistory.update({
      where: { id },
      data: updatedData,
    });
  }

  async createNewStatusEntry(
    prevId: number,
    newStatus: string,
    portId?: number | null,
    addressBookId?: number | null,
    remarks?: string,
    vesselName?: string,
  ) {
    const previous = await this.prisma.movementHistory.findUnique({
      where: { id: prevId },
    });

    if (!previous) {
      throw new NotFoundException(
        `MovementHistory with ID ${prevId} not found`,
      );
    }

    // fetch shipment or emptyRepoJob if needed
    let shipment: any | null = null;
    let emptyRepoJob: any | null = null;

    if (previous.shipmentId) {
      shipment = await this.prisma.shipment.findUnique({
        where: { id: previous.shipmentId },
        select: {
          polPortId: true,
          podPortId: true,
          carrierAddressBookId: true,
          emptyReturnDepotAddressBookId: true,
        },
      });
    } else if (previous.emptyRepoJobId) {
      emptyRepoJob = await this.prisma.emptyRepoJob.findUnique({
        where: { id: previous.emptyRepoJobId },
        select: {
          polPortId: true,
          podPortId: true,
          carrierAddressBookId: true,
          emptyReturnDepotAddressBookId: true,
        },
      });
    }

    const status = newStatus.toUpperCase();

    const {
      portId: finalPortId,
      addressBookId: finalAddressBookId,
      remarks: finalRemarks,
      vesselName: finalVesselName,
      status: finalStatus,
    } = await this.resolveStatusTransition(
      status,
      previous,
      shipment,
      emptyRepoJob,
      addressBookId ?? undefined,
      remarks,
      vesselName,
    );

    return this.prisma.movementHistory.create({
      data: {
        inventoryId: previous.inventoryId,
        shipmentId: previous.shipmentId ?? null,
        emptyRepoJobId: previous.emptyRepoJobId ?? null,
        portId: finalPortId,
        addressBookId: finalAddressBookId,
        status: finalStatus,
        date: new Date(),
        remarks: finalRemarks,
        vesselName: finalVesselName,
      },
    });
  }

  async findLatestPerContainer() {
    const latestMovements = await this.prisma.$queryRaw<
      MovementHistory[]
    >`SELECT DISTINCT ON ("inventoryId") *
       FROM "MovementHistory"
       ORDER BY "inventoryId", "date" DESC`;

    const ids = latestMovements.map((m) => m.id);

    return this.prisma.movementHistory.findMany({
      where: { id: { in: ids } },
      include: {
        inventory: true,
        port: true,
        addressBook: true,
        shipment: true,
        emptyRepoJob: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }
}
