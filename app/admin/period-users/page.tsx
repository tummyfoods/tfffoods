"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/providers/language/LanguageContext";
import toast from "react-hot-toast";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LayoutDashboard, Users, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PeriodUser {
  _id: string;
  name: string;
  email: string;
  isPeriodPaidUser: boolean;
  paymentPeriod: "weekly" | "monthly" | null;
  currentInvoice?: {
    _id: string;
    amount: number;
    status: "pending" | "paid" | "overdue";
    periodEnd: string;
  };
}

export default function PeriodUsersPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<PeriodUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
  });

  const breadcrumbItems = [
    {
      label: t("admin.dashboard.title"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("admin-periodUsers.admin.title"),
      href: "/admin/period-users",
      icon: CreditCard,
    },
  ];

  // Auto-switch to grid view on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setViewMode("grid");
      } else {
        setViewMode("table");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get("/api/admin/period-users");
      setUsers(response.data.users);
    } catch (error) {
      console.error("Error fetching period users:", error);
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.admin) {
      toast.error(t("common.unauthorized"));
      router.push("/");
      return;
    }

    if (status === "authenticated" && session?.user?.admin) {
      fetchUsers();
    }
  }, [status, session, router, fetchUsers, t]);

  const handlePeriodChange = async (
    userId: string,
    period: "weekly" | "monthly" | null
  ) => {
    try {
      await axios.put(`/api/admin/period-users/${userId}`, {
        paymentPeriod: period,
      });
      toast.success(t("common.success"));
      fetchUsers();
    } catch (error) {
      console.error("Error updating period:", error);
      toast.error(t("common.error"));
    }
  };

  const handleStatusChange = async (
    userId: string,
    isPeriodPaidUser: boolean
  ) => {
    try {
      await axios.put(`/api/admin/period-users/${userId}`, {
        isPeriodPaidUser,
      });
      toast.success(t("common.success"));
      fetchUsers();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(t("common.error"));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/admin/users", newUser);
      setShowCreateModal(false);
      setNewUser({ name: "", email: "", password: "" });
      toast.success(t("common.success"));
      fetchUsers();
    } catch (error) {
      toast.error(t("common.error"));
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === "authenticated" && !session?.user?.admin) {
    return null;
  }

  return (
    <div className="container p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("admin-periodUsers.admin.title")}
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Input
              placeholder={t("admin-periodUsers.actions.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={() => setShowCreateModal(true)}>
              {t("admin-periodUsers.actions.create")}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin-periodUsers.stats.total")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin-periodUsers.stats.active")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((user) => user.isPeriodPaidUser).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin-periodUsers.stats.monthly")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((user) => user.paymentPeriod === "monthly").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === "table" ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin-periodUsers.table.name")}</TableHead>
                <TableHead>{t("admin-periodUsers.table.email")}</TableHead>
                <TableHead>
                  {t("admin-periodUsers.table.status.title")}
                </TableHead>
                <TableHead>
                  {t("admin-periodUsers.table.paymentPeriod")}
                </TableHead>
                <TableHead>
                  {t("admin-periodUsers.table.currentPeriod")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.isPeriodPaidUser ? "success" : "destructive"
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        handleStatusChange(user._id, !user.isPeriodPaidUser)
                      }
                    >
                      {user.isPeriodPaidUser
                        ? t("admin-periodUsers.table.status.active")
                        : t("admin-periodUsers.table.status.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.paymentPeriod || "none"}
                      onValueChange={(value) =>
                        handlePeriodChange(
                          user._id,
                          value === "none"
                            ? null
                            : (value as "weekly" | "monthly")
                        )
                      }
                      disabled={!user.isPeriodPaidUser}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue
                          placeholder={t(
                            "admin-periodUsers.periodOptions.selectPeriod"
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">
                          {t("admin-periodUsers.periodOptions.week1")}
                        </SelectItem>
                        <SelectItem value="monthly">
                          {t("admin-periodUsers.periodOptions.month1")}
                        </SelectItem>
                        <SelectItem value="none">
                          {t("admin-periodUsers.periodOptions.none")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {user.currentInvoice ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              user.currentInvoice.status === "paid"
                                ? "default"
                                : user.currentInvoice.status === "overdue"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {t(
                              `admin-periodUsers.table.status.${user.currentInvoice.status}`
                            )}
                          </Badge>
                          <span className="font-medium">
                            ${user.currentInvoice.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t("admin-periodUsers.table.periodEnd")}:{" "}
                          {format(
                            new Date(user.currentInvoice.periodEnd),
                            "PPP"
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        {t("admin-periodUsers.table.noPeriod")}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <Card key={user._id} className="overflow-hidden">
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-lg font-medium truncate">
                  {user.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge
                    variant={user.isPeriodPaidUser ? "success" : "destructive"}
                    className="cursor-pointer"
                    onClick={() =>
                      handleStatusChange(user._id, !user.isPeriodPaidUser)
                    }
                  >
                    {user.isPeriodPaidUser
                      ? t("admin-periodUsers.table.status.active")
                      : t("admin-periodUsers.table.status.inactive")}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium">Payment Period</span>
                  <Select
                    value={user.paymentPeriod || "none"}
                    onValueChange={(value) =>
                      handlePeriodChange(
                        user._id,
                        value === "none"
                          ? null
                          : (value as "weekly" | "monthly")
                      )
                    }
                    disabled={!user.isPeriodPaidUser}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t(
                          "admin-periodUsers.periodOptions.selectPeriod"
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">
                        {t("admin-periodUsers.periodOptions.week1")}
                      </SelectItem>
                      <SelectItem value="monthly">
                        {t("admin-periodUsers.periodOptions.month1")}
                      </SelectItem>
                      <SelectItem value="none">
                        {t("admin-periodUsers.periodOptions.none")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {user.currentInvoice && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Current Invoice
                      </span>
                      <Badge
                        variant={
                          user.currentInvoice.status === "paid"
                            ? "default"
                            : user.currentInvoice.status === "overdue"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {t(
                          `admin-periodUsers.table.status.${user.currentInvoice.status}`
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Amount:</span>
                      <span className="font-medium">
                        ${user.currentInvoice.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("admin-periodUsers.table.periodEnd")}:{" "}
                      {format(new Date(user.currentInvoice.periodEnd), "PPP")}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin-periodUsers.actions.create")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("admin-periodUsers.form.name")}</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("admin-periodUsers.form.email")}</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {t("admin-periodUsers.form.password")}
              </Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("common.create")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
