import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export default function TestPendingRegistration() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "doctor",
    full_name: "",
    phone: "",
    specialization: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResult({
        status: response.status,
        data: data,
      });
    } catch (error) {
      setResult({
        status: "error",
        data: { error: error.message },
      });
    } finally {
      setLoading(false);
    }
  };

  const checkDatabase = async () => {
    try {
      const response = await fetch("/api/debug/database");
      const data = await response.json();
      setResult({
        status: "debug",
        data: data,
      });
    } catch (error) {
      setResult({
        status: "error",
        data: { error: error.message },
      });
    }
  };

  const createTable = async () => {
    try {
      const response = await fetch("/api/debug/create-pending-table", {
        method: "POST",
      });
      const data = await response.json();
      setResult({
        status: "table_creation",
        data: data,
      });
    } catch (error) {
      setResult({
        status: "error",
        data: { error: error.message },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Pending Registration</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Registration Form</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    full_name: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === "doctor" && (
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      specialization: e.target.value,
                    }))
                  }
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Registration"}
              </Button>
              <Button type="button" onClick={checkDatabase} variant="outline">
                Check Database
              </Button>
              <Button type="button" onClick={createTable} variant="secondary">
                Create Table
              </Button>
            </div>
          </form>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="font-medium mb-2">Status: {result.status}</p>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
