"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import axios from "axios";
import AddTariffModal from "./LandTransportform";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const StatusBadge = ({ approvalStatus }: { approvalStatus: string }) => {
  const isActive = approvalStatus === "Approved";
  return (
    <span
      className={`inline-block px-4 py-1 rounded-full text-sm font-semibold shadow transition-all duration-300
        ${isActive ? "bg-green-700 text-green-200" : "bg-red-700 text-red-200"}
        hover:scale-105`}
      style={{ minWidth: 70, textAlign: "center", letterSpacing: 1 }}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

type Tariff = {
  id: number;
  landTransportTariffCode: string;
  addressBookId: string;
  transportType: string;
  from: string;
  to: string;
  distance: string;
  currencyId: string;
  amount: string;
  approvalStatus: string;
  addressBook?: { companyName?: string };
  currency?: { currencyName?: string };
};

const LandTransportTariff = () => {
  const [showModal, setShowModal] = useState(false);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [form, setForm] = useState({
    id: undefined as number | undefined,
    landTransportTariffCode: "",
    addressBookId: "",
    transportType: "",
    from: "",
    to: "",
    distance: "",
    currencyId: "",
    amount: "",
    approvalStatus: "Pending",
  });

  const [handlingPermissions, setHandlingPermissions] = useState<{
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
  } | null>(null);

  // Fetch permissions on mount
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    fetch(`http://localhost:8000/permissions?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const perm = data.find(
          (p: any) => p.module.toLowerCase() === "landtransportcost"
        );
        setHandlingPermissions(perm || null);
      })
      .catch((err) => console.error("Failed to fetch permissions:", err));
  }, []);

  const fetchTariffs = async () => {
    try {
      const res = await axios.get("http://localhost:8000/land-transport-tariff");
      setTariffs(res.data);
    } catch (err) {
      console.error("Error fetching tariffs:", err);
    }
  };

  useEffect(() => {
    fetchTariffs();
  }, []);

  // Permission-protected handlers

  const handleAddWithPermission = () => {
    if (!handlingPermissions) {
      alert("Permissions are still loading, please wait.");
      return;
    }
    if (handlingPermissions.canCreate) {
      setForm({
        id: undefined,
        landTransportTariffCode: "",
        addressBookId: "",
        transportType: "",
        from: "",
        to: "",
        distance: "",
        currencyId: "",
        amount: "",
        approvalStatus: "Pending",
      });
      setShowModal(true);
    } else {
      alert("You don't have access to create tariffs.");
    }
  };

  const handleEditWithPermission = (id: number) => {
    if (!handlingPermissions) {
      alert("Permissions are still loading, please wait.");
      return;
    }
    if (handlingPermissions.canEdit) {
      const tariffToEdit = tariffs.find((t) => t.id === id);
      if (tariffToEdit) {
        setForm({
          id: tariffToEdit.id,
          landTransportTariffCode: tariffToEdit.landTransportTariffCode || "",
          addressBookId: tariffToEdit.addressBookId || "",
          transportType: tariffToEdit.transportType || "",
          from: tariffToEdit.from || "",
          to: tariffToEdit.to || "",
          distance: tariffToEdit.distance || "",
          currencyId: tariffToEdit.currencyId || "",
          amount: tariffToEdit.amount || "",
          approvalStatus: tariffToEdit.approvalStatus || "Pending",
        });
        setShowModal(true);
      }
    } else {
      alert("You don't have access to edit tariffs.");
    }
  };

  const handleDeleteWithPermission = async (id: number) => {
    if (!handlingPermissions) {
      alert("Permissions are still loading, please wait.");
      return;
    }
    if (handlingPermissions.canDelete) {
      if (!confirm("Are you sure you want to delete this tariff?")) return;
      try {
        await axios.delete(`http://localhost:8000/land-transport-tariff/${id}`);
        fetchTariffs();
      } catch (err) {
        console.error("Error deleting tariff:", err);
      }
    } else {
      alert("You don't have access to delete tariffs.");
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const filteredTariffs = tariffs.filter((row) => {
    const term = searchTerm.toLowerCase();
    return (
      row.landTransportTariffCode?.toLowerCase().includes(term) ||
      row.transportType?.toLowerCase().includes(term) ||
      row.from?.toLowerCase().includes(term) ||
      row.to?.toLowerCase().includes(term) ||
      row.currency?.currencyName?.toLowerCase().includes(term) ||
      row.approvalStatus?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="px-4 pt-4 pb-4 dark:bg-black">
      <div className="flex items-center justify-between mt-0 mb-4">
        <div className="relative w-full mr-4">
          <input
            type="text"
            placeholder="Search tariffs..."
            className="p-2 pl-10 rounded-lg bg-white dark:bg-neutral-900 text-black dark:text-white placeholder-neutral-400 border border-neutral-800 focus:outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
        </div>
        <Button
          onClick={handleAddWithPermission}
          disabled={!handlingPermissions?.canCreate}
          className={`bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium py-2 px-6 shadow rounded-md whitespace-nowrap ${
            !handlingPermissions?.canCreate
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer"
          }`}
        >
          <Plus className="mr-2" size={16} /> Add Tariff
        </Button>
      </div>

      {showModal && (
        <AddTariffModal
          onClose={() => setShowModal(false)}
          formTitle={form.id ? "Edit Land Transport Tariff" : "Add Land Transport Tariff"}
          form={form}
          setForm={setForm}
          fetchTariffs={fetchTariffs}
        />
      )}

      <div className="rounded-lg shadow border border-neutral-800 bg-white dark:bg-neutral-900 overflow-x-auto mt-4">
        <Table>
          <TableHeader className="bg-white dark:bg-neutral-900">
            <TableRow>
              {[
                "Tariff Code",
                "Company",
                "From",
                "To",
                "Distance",
                "Transport Type",
                "Amount",
                "Currency",
                "Status",
                "Actions",
              ].map((header) => (
                <TableHead
                  key={header}
                  className="text-black dark:text-neutral-200"
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTariffs.length > 0 ? (
              filteredTariffs.map((row, idx) => (
                <TableRow
                  key={row.id}
                  className={`border-b border-neutral-800 text-black dark:text-white ${
                    idx % 2 === 1
                      ? "bg-gray-50 dark:bg-neutral-800"
                      : "bg-white dark:bg-neutral-900"
                  }`}
                >
                  <TableCell>{row.landTransportTariffCode}</TableCell>
                  <TableCell>{row.addressBook?.companyName || "N/A"}</TableCell>
                  <TableCell>{row.from}</TableCell>
                  <TableCell>{row.to}</TableCell>
                  <TableCell>{row.distance}</TableCell>
                  <TableCell>{row.transportType}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>{row.currency?.currencyName || "N/A"}</TableCell>
                  <TableCell>
                    <StatusBadge approvalStatus={row.approvalStatus || "Pending"} />
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditWithPermission(row.id)}
                      disabled={!handlingPermissions?.canEdit}
                      className={`h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/40 dark:hover:bg-blue-900/40 ${
                        !handlingPermissions?.canEdit
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteWithPermission(row.id)}
                      disabled={!handlingPermissions?.canDelete}
                      className={`h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/40 dark:hover:bg-red-900/40 ${
                        !handlingPermissions?.canDelete
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-6 text-gray-400 bg-white dark:bg-neutral-900"
                >
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LandTransportTariff;
