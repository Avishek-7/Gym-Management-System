import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { Bill } from "../../types/billing";
import { getAllBills, getUserBills } from "../../services/billing/billService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

interface BillHistoryProps {
    memberId?: string;
    isAdmin?: boolean;
    autoLoad?: boolean;
}

export const BillHistory: React.FC<BillHistoryProps> = ({ 
    memberId, 
    isAdmin = false,
    autoLoad = false 
}) => {
    const [bills, setBills] = useState<Bill[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBills = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Use getUserBills for members, getAllBills for admins
            const fetchedBills = (!isAdmin && memberId) 
                ? await getUserBills(memberId)
                : await getAllBills();
            
            setBills(fetchedBills);
        } catch (err) {
            console.error("Error fetching bills:", err);
            setError("Failed to fetch bills. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-load bills on mount if autoLoad is true
    useEffect(() => {
        if (autoLoad) {
            fetchBills();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoLoad, memberId]);

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return 'N/A';
        try {
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Invalid Date';
        }
    };

    const formatAmount = (amount: number | undefined) => {
        if (amount === undefined || amount === null) return '$0.00';
        return `$${amount.toFixed(2)}`;
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'overdue':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <Card className="w-full backdrop-blur-sm bg-gray-900/70 border-white/20">
            <CardHeader className="border-b border-gray-800">
                <CardTitle className="text-2xl font-bold text-white">
                    Bill History
                </CardTitle>
                <CardDescription className="text-gray-400">
                    {isAdmin 
                        ? "View all billing records" 
                        : "View your billing history and details"}
                </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
                {!autoLoad && (
                    <div className="mb-6">
                        <Button 
                            onClick={fetchBills} 
                            disabled={isLoading}
                            className="w-full bg-blue-500 hover:bg-blue-600"
                        >
                            {isLoading ? "Loading..." : "Load Bills"}
                        </Button>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                        <p className="font-medium">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-3 text-gray-400">Loading bills...</span>
                    </div>
                )}

                {!isLoading && bills.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-gray-800">
                        <Table>
                            <TableHeader className="bg-gray-800/50">
                                <TableRow className="border-gray-700 hover:bg-gray-800/50">
                                    <TableHead className="text-gray-300 font-semibold">Bill #</TableHead>
                                    <TableHead className="text-gray-300 font-semibold">Date</TableHead>
                                    <TableHead className="text-gray-300 font-semibold">Amount</TableHead>
                                    <TableHead className="text-gray-300 font-semibold">Status</TableHead>
                                    <TableHead className="text-gray-300 font-semibold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bills.map((bill) => (
                                    <TableRow 
                                        key={bill.id} 
                                        className="border-gray-800 hover:bg-gray-800/30 transition-colors"
                                    >
                                        <TableCell className="text-gray-200 font-mono text-sm">
                                            {bill.billNumber || bill.id.slice(0, 8)}
                                        </TableCell>
                                        <TableCell className="text-gray-200">
                                            {formatDate(bill.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-gray-200 font-semibold">
                                            {formatAmount(bill.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                                getStatusColor(bill.status)
                                            }`}>
                                                {bill.status || 'Unknown'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link to={`/bills/${bill.id}`}>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                                >
                                                    View Details
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {!isLoading && bills.length === 0 && !error && (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                            <svg 
                                className="w-8 h-8 text-gray-500" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                                />
                            </svg>
                        </div>
                        <p className="text-gray-400 text-lg mb-2">No bills found</p>
                        <p className="text-gray-500 text-sm">
                            {autoLoad 
                                ? "There are no billing records to display"
                                : 'Click "Load Bills" to fetch your billing history'}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};