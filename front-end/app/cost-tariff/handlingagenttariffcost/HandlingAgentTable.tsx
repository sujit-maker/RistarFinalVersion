"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddTariffModal from "./HandlingAgentTariff";

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status.toLowerCase() === "active";
  return (
    <span
      className={`inline-block px-4 py-1 rounded-full text-sm font-semibold shadow transition-all duration-300
        ${isActive ? "bg-green-700 text-green-200" : "bg-red-700 text-red-200"}
        hover:scale-105`}
      style={{
        minWidth: 70,
        textAlign: "center",
        letterSpacing: 1,
      }}
    >
      {status}
    </span>
  );
};

const CostTariffPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [tariffData, setTariffData] = useState<any[]>([]);
  const [form, setForm] = useState({
    id: undefined,
    status: "Active",
    tariffCode: "",
    handlingAgentName: "",
    servicePort: "",
    currency: "USD",
    "IMP Commission": 0,
    "EXP Commission": 0,
    "Transhipment Commission": 0,
    "Empty Repo Commission": 0,
    "Detention Commission": 0,
  });
  const [handlingAgentPermissions, setHandlingAgentPermissions] = useState<any>(null);

useEffect(() => {
  const userId = localStorage.getItem("userId");
  if (userId) {
    fetch(`http://localhost:8000/permissions?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const perm = data.find(
          (p: any) => p.module.toLowerCase() === "handlingagenttariffcost"
        );
        setHandlingAgentPermissions(perm);
      })
      .catch((err) => console.error("Failed to fetch permissions:", err));
  }
}, []);

const handleAddHandlingAgentWithPermission = () => {
  if (handlingAgentPermissions?.canCreate) {
    setForm({
      id: undefined,
      status: "Active",
      tariffCode: "",
      handlingAgentName: "",
      servicePort: "",
      currency: "USD",
      "IMP Commission": 0,
      "EXP Commission": 0,
      "Transhipment Commission": 0,
      "Empty Repo Commission": 0,
      "Detention Commission": 0,
    });
    setShowModal(true);
  } else {
    alert("You don't have access to create handling agent tariffs.");
  }
};

const handleEditClick = (id: number) => {
  const tariffToEdit = tariffData.find(item => item.id === id);
  if (tariffToEdit) {
    setForm({
      id: tariffToEdit.id,
      status: tariffToEdit.status,
      tariffCode: tariffToEdit.tariffCode,
      handlingAgentName: tariffToEdit.addressBookId?.toString() || "",
      servicePort: tariffToEdit.portId?.toString() || "",
      currency: tariffToEdit.currencyId?.toString() || "",
      "IMP Commission": tariffToEdit.impCommission,
      "EXP Commission": tariffToEdit.expCommission,
      "Transhipment Commission": tariffToEdit.transhipmentCommission,
      "Empty Repo Commission": tariffToEdit.emptyRepoCommission,
      "Detention Commission": tariffToEdit.detentionCommission,
    });
    setShowModal(true);
  }
};



const handleEditHandlingAgentWithPermission = (id: number) => {
  if (handlingAgentPermissions?.canEdit) {
    handleEditClick(id);
  } else {
    alert("You don't have access to edit handling agent tariffs.");
  }
};

const handleDeleteHandlingAgentWithPermission = (id: number) => {
  if (handlingAgentPermissions?.canDelete) {
    handleDelete(id);
  } else {
    alert("You don't have access to delete ports.");
  }
};



  const fetchTariffData = async () => {
    try {
      const response = await axios.get("http://localhost:8000/handling-agent-tariff-cost");
      setTariffData(response.data);
    } catch (error) {
      console.error("Failed to fetch tariff data", error);
    }
  };

  useEffect(() => {
    fetchTariffData();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await axios.delete(`http://localhost:8000/handling-agent-tariff-cost/${id}`);
        fetchTariffData();
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  return (
    // Keep the full height container with overflow-auto
    <div className="h-screen overflow-auto bg-white dark:bg-black">
      {/* Reduce the min-width to prevent table from pushing sidebar */}
      <div className="px-4 py-6 min-w-[1200px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Handling Agent Tariff</h2>
         <Button
  onClick={handleAddHandlingAgentWithPermission}
  disabled={!handlingAgentPermissions?.canCreate}
  className={`bg-blue-700 hover:bg-blue-800 text-white cursor-pointer ${
    !handlingAgentPermissions?.canCreate ? "opacity-50 cursor-not-allowed" : ""
  }`}
>
  <Plus className="mr-2" size={16} /> Add Tariff
</Button>

        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto border border-neutral-200 dark:border-neutral-800 p-0">
              <AddTariffModal
                onClose={() => setShowModal(false)}
                formTitle={form.id ? "Edit Tariff" : "Add Tariff"}
                form={form}
                setForm={setForm}
                handleSuccess={fetchTariffData}
              />
            </div>
          </div>
        )}

        <div className="rounded-lg shadow border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          {/* Add a wrapper div with horizontal scroll for just the table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                      <TableRow>
                        {/* Make header cells more compact */}
                        {["Tariff Code", "Agent", "Service", "Currency", "IMP", "EXP", "Tranship", "Empty Repo", "Detention", "Status", "Actions"].map(
                          (header) => (
                            <TableHead key={header} className="px-2 py-2 whitespace-nowrap text-black dark:text-neutral-200">
                              {header}
                            </TableHead>
                          )
                        )}
                      </TableRow>
              </TableHeader>
              <TableBody>
                {tariffData.length > 0 ? (
                  tariffData.map((item: any) => (
                    <TableRow key={item.id} className="hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white">
                      <TableCell>{item.tariffCode}</TableCell>
                      <TableCell>{item.addressBook?.companyName || "N/A"}</TableCell>
                      <TableCell>{item.port?.portName || "N/A"}</TableCell>
                      <TableCell>{item.currency?.currencyName || "N/A"}</TableCell>
                      <TableCell>{item.impCommission}</TableCell>
                      <TableCell>{item.expCommission}</TableCell>
                      <TableCell>{item.transhipmentCommission}</TableCell>
                      <TableCell>{item.emptyRepoCommission}</TableCell>
                      <TableCell>{item.detentionCommission}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="space-x-2">
                      <Button
  variant="ghost"
  size="icon"
  onClick={() => handleEditHandlingAgentWithPermission(item.id)}
  disabled={!handlingAgentPermissions?.canEdit}
  className={`h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/40 cursor-pointer dark:hover:bg-blue-900/40 ${
    !handlingAgentPermissions?.canEdit ? "opacity-50 cursor-not-allowed" : ""
  }`}
>
  <Pencil size={16} />
</Button>

<Button
  variant="ghost"
  size="icon"
  onClick={() => handleDeleteHandlingAgentWithPermission(item.id)}
  disabled={!handlingAgentPermissions?.canDelete}
  className={`h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/40 cursor-pointer dark:hover:bg-red-900/40 ${
    !handlingAgentPermissions?.canDelete ? "opacity-50 cursor-not-allowed" : ""
  }`}
>
  <Trash2 size={16} />
</Button>

                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-6 text-gray-400">
                      No records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostTariffPage;
