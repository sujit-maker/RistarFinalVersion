"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import AddTariffModal from "./DepotCleaningForm";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status?.toLowerCase() === "active";
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

const DepotCleaningTable = () => {
  const [showModal, setShowModal] = useState(false);
  const [tariffData, setTariffData] = useState<any[]>([]);
  const [form, setForm] = useState({
    id: undefined as number | undefined,
    status: "active",
    tariffCode: "",
    cleaningCharges: "0",
    addressBookId: 0,
    portId: 0,
    productId: 0,
    currencyId: 0,
  });

  // Permissions state
  const [permissions, setPermissions] = useState<{
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
          (p: any) => p.module.toLowerCase() === "depotcleaningcost"
        );
        setPermissions(perm || null);
      })
      .catch((err) => console.error("Failed to fetch permissions:", err));
  }, []);

  const fetchTariffs = async () => {
    try {
      const res = await axios.get("http://localhost:8000/depot-cleaning-tariff-cost");
      setTariffData(res.data);
    } catch (err) {
      console.error("Error fetching tariff data", err);
    }
  };

  useEffect(() => {
    fetchTariffs();
  }, []);

  // Permission-checked Add handler
  const handleAddWithPermission = () => {
    if (!permissions) {
      alert("Permissions are loading, please wait.");
      return;
    }
    if (permissions.canCreate) {
      setForm({
        id: undefined,
        status: "active",
        tariffCode: "",
        cleaningCharges: "0",
        addressBookId: 0,
        portId: 0,
        productId: 0,
        currencyId: 0,
      });
      setShowModal(true);
    } else {
      alert("You don't have access to add depot cleaning tariffs.");
    }
  };

  // Permission-checked Edit handler
  const handleEditWithPermission = (tariff: any) => {
    if (!permissions) {
      alert("Permissions are loading, please wait.");
      return;
    }
    if (permissions.canEdit) {
      setForm({
        id: tariff.id,
        status: tariff.status || "inactive",
        tariffCode: tariff.tariffCode || "",
        productId: tariff.productId || 0,
        addressBookId: tariff.addressBookId || 0,
        portId: tariff.portId || 0,
        currencyId: tariff.currencyId || 0,
        cleaningCharges: String(tariff.cleaningCharges || "0"),
      });
      setShowModal(true);
    } else {
      alert("You don't have access to edit depot cleaning tariffs.");
    }
  };

  // Permission-checked Delete handler
  const handleDeleteWithPermission = async (id: number) => {
    if (!permissions) {
      alert("Permissions are loading, please wait.");
      return;
    }
    if (permissions.canDelete) {
      if (!confirm("Are you sure you want to delete this tariff?")) return;
      try {
        await axios.delete(`http://localhost:8000/depot-cleaning-tariff-cost/${id}`);
        fetchTariffs();
      } catch (err) {
        console.error("Failed to delete item", err);
      }
    } else {
      alert("You don't have access to delete depot cleaning tariffs.");
    }
  };

  return (
    <div className="px-4 py-6 bg-white dark:bg-black min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Depot Cleaning Cost</h2>
        <Button
          onClick={handleAddWithPermission}
          disabled={!permissions?.canCreate}
          className={`bg-blue-700 hover:bg-blue-800 text-white cursor-pointer ${
            !permissions?.canCreate ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Plus className="mr-2" size={16} /> Add Tariff
        </Button>
      </div>

      {showModal && (
        <AddTariffModal
          onClose={() => {
            setShowModal(false);
            fetchTariffs();
          }}
          formTitle={form.id ? "Edit Tariff" : "Add Tariff"}
          form={form}
          setForm={setForm}
        />
      )}

      <div className="rounded-lg shadow border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-2 py-2 whitespace-nowrap text-black dark:text-neutral-200">Tariff Code</TableHead>
              <TableHead className="px-2 py-2 whitespace-nowrap text-black dark:text-neutral-200">Depot Terminal</TableHead>
              <TableHead className="px-2 py-2 whitespace-nowrap text-black dark:text-neutral-200">Service Port</TableHead>
              <TableHead className="px-2 py-2 whitespace-nowrap text-black dark:text-neutral-200">Product</TableHead>
              <TableHead className="px-2 py-2 whitespace-nowrap text-black dark:text-neutral-200">Currency</TableHead>
              <TableHead className="px-2 py-2 whitespace-nowrap text-black dark:text-neutral-200">Cleaning Charge</TableHead>
              <TableHead className="px-2 py-2 whitespace-nowrap text-black dark:text-neutral-200">Status</TableHead>
              <TableHead className="px-2 py-2 whitespace-nowrap text-black dark:text-neutral-200 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tariffData.length > 0 ? (
              tariffData.map((tariff: any) => (
                <TableRow key={tariff.id} className="hover:bg-neutral-100 dark:hover:bg-neutral-800 text-black dark:text-white">
                  <TableCell>{tariff.tariffCode}</TableCell>
                  <TableCell>{tariff.addressBook?.companyName || "N/A"}</TableCell>
                  <TableCell>{tariff.port?.portName || "N/A"}</TableCell>
                  <TableCell>{tariff.product?.productName || "N/A"}</TableCell>
                  <TableCell>{tariff.currency?.currencyCode || "N/A"}</TableCell>
                  <TableCell>{tariff.cleaningCharges}</TableCell>
                  <TableCell>
                    <StatusBadge status={tariff.status} />
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit"
                      onClick={() => handleEditWithPermission(tariff)}
                      disabled={!permissions?.canEdit}
                      className={`h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/40 dark:hover:bg-blue-900/40 ${
                        !permissions?.canEdit ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      onClick={() => handleDeleteWithPermission(tariff.id)}
                      disabled={!permissions?.canDelete}
                      className={`h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/40 dark:hover:bg-red-900/40 ${
                        !permissions?.canDelete ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-gray-400">
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

export default DepotCleaningTable;
