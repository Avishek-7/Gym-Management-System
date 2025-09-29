import type { ChangeEvent, FC, FormEvent } from "react";
import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/form-input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";

import type { Bill } from "../../types/billing";

interface BillManagementProps {
    bills: Bill[];
    onAddBill: (bill: Bill) => void;
    onUpdateBill: (updateBill: Bill) => void;
    onDeleteBill: (billId: string) => void;
}

type PaymentMethod = NonNullable<Bill["paymentMethod"]>;

interface BillFormState {
    userId: string;
    membershipId: string;
    billNumber: string;
    amount: number;
    taxAmount: number;
    discountApplied: number;
    dueDate: string;
    status: Bill["status"];
    paymentMethod: PaymentMethod;
    items: Bill["items"];
}

const createEmptyFormState = (): BillFormState => ({
    userId: "",
    membershipId: "",
    billNumber: "",
    amount: 0,
    taxAmount: 0,
    discountApplied: 0,
    dueDate: "",
    status: "pending",
    paymentMethod: "cash",
    items: [],
});

const BillManagement: FC<BillManagementProps> = ({
    bills,
    onAddBill,
    onUpdateBill,
    onDeleteBill,
}) => {
    const [formState, setFormState] = useState<BillFormState>(createEmptyFormState());
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [dueDateWarning, setDueDateWarning] = useState<string | null>(null);

    const numericFields = useMemo(() => new Set<keyof BillFormState>(["amount", "taxAmount", "discountApplied"]), []);
    const currencyFormatter = useMemo(
        () =>
            new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
            }),
        [],
    );

    const computedTotal = useMemo(
        () => Math.max(0, formState.amount + formState.taxAmount - formState.discountApplied),
        [formState.amount, formState.taxAmount, formState.discountApplied],
    );

    const meetsRequiredFields =
        formState.userId.trim() !== "" &&
        formState.membershipId.trim() !== "" &&
        formState.dueDate.trim() !== "" &&
        formState.amount > 0;
    const isFormValid = meetsRequiredFields && Object.keys(errors).length === 0;

    const selectLabelIds = useMemo(
        () => ({
            status: "bill-status-label",
            paymentMethod: "bill-payment-label",
        }),
        [],
    );

    const handleFieldErrorClear = (field: string) => {
        setErrors((prev) => {
            if (!prev[field]) {
                return prev;
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [field]: _removed, ...rest } = prev;
            return rest;
        });
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        const fieldName = name as keyof BillFormState;

        setFormState((prev) => ({
            ...prev,
            [fieldName]: numericFields.has(fieldName) ? Number(value) : value,
        }));
        handleFieldErrorClear(name);
    };

    const handleDateChange = (value: string) => {
        setFormState((prev) => ({
            ...prev,
            dueDate: value,
        }));
        handleFieldErrorClear("dueDate");

        if (!value) {
            setDueDateWarning(null);
            return;
        }

        const selectedDate = new Date(value);
        if (Number.isNaN(selectedDate.getTime())) {
            setDueDateWarning(null);
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setDueDateWarning(selectedDate < today ? "Selected due date is in the past." : null);
    };

    const handleStatusChange = (value: Bill["status"]) => {
        setFormState((prev) => ({
            ...prev,
            status: value,
        }));
    };

    const handlePaymentMethodChange = (value: PaymentMethod) => {
        setFormState((prev) => ({
            ...prev,
            paymentMethod: value,
        }));
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validationErrors: Record<string, string> = {};

        if (!formState.userId.trim()) {
            validationErrors.userId = "User ID is required.";
        }
        if (!formState.membershipId.trim()) {
            validationErrors.membershipId = "Membership ID is required.";
        }
        if (formState.amount <= 0) {
            validationErrors.amount = "Amount must be greater than zero.";
        }
        if (formState.taxAmount < 0) {
            validationErrors.taxAmount = "Tax amount cannot be negative.";
        }
        if (formState.discountApplied < 0) {
            validationErrors.discountApplied = "Discount cannot be negative.";
        }
        if (formState.discountApplied > formState.amount + formState.taxAmount) {
            validationErrors.discountApplied = "Discount cannot exceed subtotal.";
        }
        if (!formState.dueDate.trim()) {
            validationErrors.dueDate = "Due date is required.";
        }

        const dueDateValue = formState.dueDate ? new Date(formState.dueDate) : null;
        if (!dueDateValue || Number.isNaN(dueDateValue.getTime())) {
            validationErrors.dueDate = "Please select a valid due date.";
        }

        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0 || !dueDateValue) {
            return;
        }

        const now = new Date();
        const generatedBillNumber =
            formState.billNumber.trim() || editingBill?.billNumber || `BILL-${Date.now()}`;
        const baseBillData = {
            userId: formState.userId.trim(),
            membershipId: formState.membershipId.trim(),
            subscriptionId: editingBill?.subscriptionId,
            billNumber: generatedBillNumber,
            amount: formState.amount,
            taxAmount: formState.taxAmount,
            totalAmount: computedTotal,
            dueDate: dueDateValue,
            status: formState.status,
            items: formState.items,
            discountApplied: formState.discountApplied > 0 ? formState.discountApplied : undefined,
            paymentMethod: formState.paymentMethod,
            paidAt: editingBill?.paidAt,
            createdAt: editingBill?.createdAt ?? now,
            updatedAt: now,
        } satisfies Omit<Bill, "id">;

        if (editingBill) {
            onUpdateBill({ ...editingBill, ...baseBillData });
        } else {
            const generatedId =
                typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
                    ? crypto.randomUUID()
                    : `bill-${Date.now()}`;

            onAddBill({
                id: generatedId,
                ...baseBillData,
            });
        }

        setFormState(createEmptyFormState());
        setEditingBill(null);
        setErrors({});
        setDueDateWarning(null);
    };

    const handleEdit = (bill: Bill) => {
        setEditingBill(bill);
        const dueDateValue = bill.dueDate instanceof Date ? bill.dueDate : new Date(bill.dueDate);
        const dueDateString = Number.isNaN(dueDateValue.getTime())
            ? ""
            : dueDateValue.toISOString().split("T")[0];

        setFormState({
            userId: bill.userId,
            membershipId: bill.membershipId,
            billNumber: bill.billNumber,
            amount: bill.amount,
            taxAmount: bill.taxAmount,
            discountApplied: bill.discountApplied ?? 0,
            dueDate: dueDateString,
            status: bill.status,
            paymentMethod: bill.paymentMethod ?? "cash",
            items: bill.items,
        });
        setErrors({});
        setDueDateWarning(null);
    };

    const handleDelete = (billId: string) => {
        const billToDelete = bills.find((bill) => bill.id === billId);
        const billLabel = billToDelete?.billNumber || billToDelete?.id || "this bill";

        const shouldDelete = window.confirm(`Delete ${billLabel}? This action cannot be undone.`);
        if (shouldDelete) {
            onDeleteBill(billId);
        }
    };

    const resetForm = () => {
        setFormState(createEmptyFormState());
        setEditingBill(null);
        setErrors({});
        setDueDateWarning(null);
    };

    const formatCurrency = (value: number) => currencyFormatter.format(value);
    const formatDueDate = (value: Date | string) => {
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "—";
        }
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{editingBill ? "Edit Bill" : "Add Bill"}</CardTitle>
                    <CardDescription>
                        {editingBill ? "Update the bill details." : "Create a new bill for a member."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium" htmlFor="bill-user-id">
                                User ID
                            </label>
                            <Input
                                id="bill-user-id"
                                name="userId"
                                value={formState.userId}
                                onChange={handleInputChange}
                                placeholder="Enter user ID"
                                aria-describedby={errors.userId ? "bill-user-id-error" : undefined}
                                autoComplete="off"
                            />
                            {errors.userId && (
                                <p id="bill-user-id-error" className="mt-1 text-sm text-destructive">
                                    {errors.userId}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium" htmlFor="bill-membership-id">
                                Membership ID
                            </label>
                            <Input
                                id="bill-membership-id"
                                name="membershipId"
                                value={formState.membershipId}
                                onChange={handleInputChange}
                                placeholder="Enter membership ID"
                                aria-describedby={errors.membershipId ? "bill-membership-id-error" : undefined}
                                autoComplete="off"
                            />
                            {errors.membershipId && (
                                <p id="bill-membership-id-error" className="mt-1 text-sm text-destructive">
                                    {errors.membershipId}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium" htmlFor="bill-amount">
                                Amount
                            </label>
                            <Input
                                id="bill-amount"
                                name="amount"
                                type="number"
                                value={formState.amount}
                                onChange={handleInputChange}
                                min={0}
                                step={0.01}
                                aria-describedby={errors.amount ? "bill-amount-error" : undefined}
                            />
                            {errors.amount && (
                                <p id="bill-amount-error" className="mt-1 text-sm text-destructive">
                                    {errors.amount}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium" htmlFor="bill-tax-amount">
                                Tax Amount
                            </label>
                            <Input
                                id="bill-tax-amount"
                                name="taxAmount"
                                type="number"
                                value={formState.taxAmount}
                                onChange={handleInputChange}
                                min={0}
                                step={0.01}
                                aria-describedby={errors.taxAmount ? "bill-tax-amount-error" : undefined}
                            />
                            {errors.taxAmount && (
                                <p id="bill-tax-amount-error" className="mt-1 text-sm text-destructive">
                                    {errors.taxAmount}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium" htmlFor="bill-discount">
                                Discount Applied
                            </label>
                            <Input
                                id="bill-discount"
                                name="discountApplied"
                                type="number"
                                value={formState.discountApplied}
                                onChange={handleInputChange}
                                min={0}
                                step={0.01}
                                aria-describedby={errors.discountApplied ? "bill-discount-error" : undefined}
                            />
                            {errors.discountApplied && (
                                <p id="bill-discount-error" className="mt-1 text-sm text-destructive">
                                    {errors.discountApplied}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium" htmlFor="bill-due-date">
                                Due Date
                            </label>
                            <Input
                                id="bill-due-date"
                                name="dueDate"
                                type="date"
                                value={formState.dueDate}
                                onChange={(event) => handleDateChange(event.target.value)}
                                aria-describedby={
                                    errors.dueDate
                                        ? "bill-due-date-error"
                                        : dueDateWarning
                                          ? "bill-due-date-warning"
                                          : undefined
                                }
                            />
                            {errors.dueDate && (
                                <p id="bill-due-date-error" className="mt-1 text-sm text-destructive">
                                    {errors.dueDate}
                                </p>
                            )}
                            {!errors.dueDate && dueDateWarning && (
                                <p id="bill-due-date-warning" className="mt-1 text-sm text-muted-foreground">
                                    {dueDateWarning}
                                </p>
                            )}
                        </div>

                        <div>
                            <span id={selectLabelIds.status} className="block text-sm font-medium">
                                Status
                            </span>
                            <Select value={formState.status} onValueChange={handleStatusChange}>
                                <SelectTrigger aria-labelledby={selectLabelIds.status}>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <span id={selectLabelIds.paymentMethod} className="block text-sm font-medium">
                                Payment Method
                            </span>
                            <Select value={formState.paymentMethod} onValueChange={handlePaymentMethodChange}>
                                <SelectTrigger aria-labelledby={selectLabelIds.paymentMethod}>
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="upi">UPI</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium" htmlFor="bill-number">
                                Bill Number (optional)
                            </label>
                            <Input
                                id="bill-number"
                                name="billNumber"
                                value={formState.billNumber}
                                onChange={handleInputChange}
                                placeholder="Auto-generated if left blank"
                                autoComplete="off"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium" htmlFor="bill-total">
                                Calculated Total
                            </label>
                            <Input id="bill-total" name="totalAmount" value={formatCurrency(computedTotal)} readOnly />
                        </div>

                        <CardFooter className="flex gap-2 px-0">
                            <Button type="submit" disabled={!isFormValid}>
                                {editingBill ? "Update Bill" : "Add Bill"}
                            </Button>
                            {editingBill && (
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                            )}
                        </CardFooter>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Bills</CardTitle>
                    <CardDescription>Manage existing bills.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bill Number</TableHead>
                                <TableHead>User ID</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bills.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                                        No bills yet. Use the form above to create one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                bills.map((bill) => {
                                    const totalAmount =
                                        typeof bill.totalAmount === "number"
                                            ? bill.totalAmount
                                            : bill.amount + (bill.taxAmount ?? 0) - (bill.discountApplied ?? 0);

                                    return (
                                        <TableRow key={bill.id}>
                                            <TableCell>{bill.billNumber}</TableCell>
                                            <TableCell>{bill.userId}</TableCell>
                                            <TableCell>{formatCurrency(bill.amount)}</TableCell>
                                            <TableCell>{formatCurrency(totalAmount)}</TableCell>
                                            <TableCell>{bill.status}</TableCell>
                                            <TableCell>{formatDueDate(bill.dueDate)}</TableCell>
                                            <TableCell className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleEdit(bill)}
                                                    aria-label={`Edit bill ${bill.billNumber}`}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDelete(bill.id)}
                                                    aria-label={`Delete bill ${bill.billNumber}`}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default BillManagement;



