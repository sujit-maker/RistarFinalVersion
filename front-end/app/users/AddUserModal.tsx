"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AddUserModal({
  isOpen,
  onClose,
  onUserAdded,
  editUser // <-- Pass user object here when editing
}: {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
  editUser?: any;
}) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    departmentName: "",
    email: "",
    contact: "",
    userType: ""
  });

  // Populate form when editing
  useEffect(() => {
    if (editUser) {
      setFormData({
        username: editUser.username || "",
        password: "",
        firstName: editUser.firstName || "",
        lastName: editUser.lastName || "",
        departmentName: editUser.departmentName || "",
        email: editUser.email || "",
        contact: editUser.contact || "",
        userType: editUser.userType || ""
      });
    } else {
      setFormData({
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        departmentName: "",
        email: "",
        contact: "",
        userType: ""
      });
    }
  }, [editUser]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      let url = "http://localhost:8000/users";
      let method: "POST" | "PATCH" = "POST";

      const payload: any = { ...formData };

      if (editUser && editUser.id) {
        url = `http://localhost:8000/users/${editUser.id}`;
        method = "PATCH";

        if (!payload.password) {
          delete payload.password; // avoid overwriting with empty
        }
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errMsg = await res.text();
        throw new Error(errMsg || "Failed to save user");
      }

      alert(editUser ? "User updated successfully" : "User created successfully");
      onUserAdded();
      onClose();
    } catch (err) {
      console.error("Error saving user:", err);
      alert(`Error saving user: ${(err as Error).message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg w-[500px] p-6">
        <h2 className="text-lg font-bold mb-4">
          {editUser ? "Edit User" : "Add New User"}
        </h2>

        <div className="space-y-3">
          <input
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          />
          <input
            name="password"
            placeholder={editUser ? "Leave blank to keep current password" : "Password"}
            type="text"
            value={formData.password}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          />
          <input
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          />
          <input
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          />
          <input
            name="email"
            placeholder="Email"
            type="text"
            value={formData.email}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          />
          <input
            name="contact"
            placeholder="Contact"
            value={formData.contact}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          />

          <label className="block text-sm font-medium">Select Department</label>
          <select
            name="departmentName"
            value={formData.departmentName}
            onChange={handleChange}
            className="w-full p-2 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white border border-neutral-200 dark:border-neutral-700"
          >
            <option value="">Select Department</option>
            <option value="commercial">Commercial</option>
            <option value="accounts">Accounts</option>
            <option value="operation">Operation</option>
            <option value="admin">Admin</option>
          </select>

          <label className="block text-sm font-medium">User Type</label>
          <select
            name="userType"
            value={formData.userType}
            onChange={handleChange}
            className="w-full p-2 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white border border-neutral-200 dark:border-neutral-700"
          >
            <option value="">Select User Type</option>
            <option value="SUPERADMIN">SUPERADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-blue-700 hover:bg-blue-800 text-white"
            onClick={handleSave}
          >
            {editUser ? "Update" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
