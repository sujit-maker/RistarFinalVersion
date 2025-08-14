"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function AddUserModal({ isOpen, onClose, onUserAdded }: { 
  isOpen: boolean, 
  onClose: () => void,
  onUserAdded: () => void 
}) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    departmentName: "",
    email: "",
    contact: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await fetch("http://localhost:8000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Failed to create user");
      alert("User created successfully");
      onUserAdded();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error creating user");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg w-[500px] p-6">
        <h2 className="text-lg font-bold mb-4">Add New User</h2>

        <div className="space-y-3">
          <input name="username" placeholder="Username" value={formData.username} onChange={handleChange} className="border p-2 w-full rounded" />
          <input name="password" placeholder="Password" type="text" value={formData.password} onChange={handleChange} className="border p-2 w-full rounded" />
          <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="border p-2 w-full rounded" />
          <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="border p-2 w-full rounded" />
          <input name="email" placeholder="Email" type="text" value={formData.email} onChange={handleChange} className="border p-2 w-full rounded" />
          <input name="contact" placeholder="Contact" value={formData.contact} onChange={handleChange} className="border p-2 w-full rounded" />
          <label htmlFor="">Select Department</label>
          <select name="departmentName" value={formData.departmentName} onChange={handleChange} className="w-full p-2 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white border border-neutral-200 dark:border-neutral-700">

            <option value="commercial">Commercial</option>
            <option value="accounts">Accounts</option>
            <option value="operation">Operation</option>
            <option value="admin">Admin</option>

          </select>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-blue-700 hover:bg-blue-800 text-white" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}
