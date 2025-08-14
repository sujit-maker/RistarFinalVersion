"use client";

import React, { useEffect, useState } from "react";
import { Search, Pencil, Trash2, Plus } from "lucide-react";
import axios from "axios";
import AddCountryForm from "./AddCountriesForm";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const StatusBadge = ({ status }: { status: boolean }) => (
  <span
    className={cn(
      "inline-block px-4 py-1 rounded-full text-sm font-semibold shadow transition-all duration-300 hover:scale-105",
      status
        ? "bg-green-900/80 text-green-300"
        : "bg-red-900/80 text-red-300"
    )}
    style={{
      minWidth: 70,
      textAlign: "center",
      letterSpacing: 1,
    }}
  >
    {status ? "Active" : "Inactive"}
  </span>
);

const CountryPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState<any>(null);
  const [search, setSearch] = useState("");

  const [countryPermissions, setCountryPermissions] = useState<any>(null);

useEffect(() => {
  const userId = localStorage.getItem("userId");
  if (userId) {
    fetch(`http://localhost:8000/permissions?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const perm = data.find(
          (p: any) => p.module.toLowerCase() === "countries"
        );
        setCountryPermissions(perm);
      })
      .catch((err) => console.error("Failed to fetch permissions:", err));
  }
}, []);

const handleAddCountryWithPermission = () => {
  if (countryPermissions?.canCreate) {
    setEditData(null);
    setShowForm(true);
  } else {
    alert("You don't have access to create countries.");
  }
};

const handleEditCountryWithPermission = (id: number) => {
  if (countryPermissions?.canEdit) {
    handleEditClick(id);
  } else {
    alert("You don't have access to edit countries.");
  }
};

const handleDeleteCountryWithPermission = (id: number) => {
  if (countryPermissions?.canDelete) {
    handleDelete(id);
  } else {
    alert("You don't have access to delete countries.");
  }
};


  const fetchCountries = async () => {
    try {
      const response = await axios.get("http://localhost:8000/country");
      setCountries(
        response.data.map((item: any) => ({
          ...item,
          status: JSON.parse(
            localStorage.getItem(`country-status-${item.countryCode}`) ?? "true"
          ),
        }))
      );
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this country?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:8000/country/${id}`);
      fetchCountries();
    } catch (err: any) {
      alert(
        "Error: " +
          (err.response?.data?.message ||
            err.message ||
            "Failed to delete country.")
      );
    }
  };

  const handleEditClick = (country: any) => {
    setEditData(country);
    setShowForm(true);
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const filteredCountries = countries.filter((country) =>
    country.countryName.toLowerCase().includes(search.toLowerCase())
  );



  return (
    <div className="px-4 pt-4 pb-4 dark:bg-black">
      <div className="flex items-center justify-between mt-0 mb-4">
        <div className="relative w-full mr-4">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            placeholder="Search countries..."
            className="h-8 p-2 pl-10 rounded-lg bg-background text-foreground placeholder-muted-foreground border border-neutral-200 dark:border-neutral-700 outline-neutral-200 dark:outline-neutral-700 focus:outline-none focus:border-blue-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
  className={cn(
    "bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium py-2 px-6 shadow rounded-md whitespace-nowrap cursor-pointer",
    !countryPermissions?.canCreate && "opacity-50 cursor-not-allowed"
  )}
  onClick={handleAddCountryWithPermission}
>
  <Plus size={16} className="mr-2" />
  Add Country
</Button>
      </div>

      <div className="rounded-lg shadow border border-border bg-background overflow-x-auto">
        <Table>
        <TableHeader className="bg-background">
            <TableRow>
              <TableHead className="text-foreground">Code</TableHead>
              <TableHead className="text-foreground">Name</TableHead>
              <TableHead className="text-foreground">Region</TableHead>
              <TableHead className="text-foreground">Currency</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
              <TableHead className="text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground bg-background">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredCountries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground bg-background">
                  No countries found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCountries.map((country: any) => (
                <TableRow key={country.id} className="transition-colors bg-background hover:bg-muted border-b border-border">
                  <TableCell className="text-foreground">{country.countryCode}</TableCell>
                  <TableCell className="text-foreground">{country.countryName}</TableCell>
                  <TableCell className="text-foreground">{country.regions}</TableCell>
                  <TableCell className="text-foreground">{country.currency?.currencyName || "-"}</TableCell>
                  <TableCell>
                    <StatusBadge status={country.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      <Button
  variant="ghost"
  size="icon"
  title="Edit"
  onClick={() => handleEditCountryWithPermission(country.id)}
  className={cn(
    "h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-900/40 dark:hover:bg-blue-900/40",
    !countryPermissions?.canEdit && "opacity-50 cursor-not-allowed"
  )}
>
  <Pencil size={16} />
</Button>
                      <Button
  variant="ghost"
  size="icon"
  title="Delete"
  onClick={() => handleDeleteCountryWithPermission(country.id)}
  className={cn(
    "h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/40 dark:hover:bg-red-900/40",
    !countryPermissions?.canDelete && "opacity-50 cursor-not-allowed"
  )}
>
  <Trash2 size={16} />
</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showForm && (
        <AddCountryForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            fetchCountries();
            setEditData(null);
          }}
          editData={editData}
        />
      )}
    </div>
  );
};

export default CountryPage;
