import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AuditLog {
    id: string;
    user_id: string;
    hospital_id: string;
    action_type: string;
    resource_type: string;
    resource_id: string;
    details: string;
    ip_address: string;
    timestamp: string;
}

interface AuditLogViewerProps {
    logs: AuditLog[];
    loading?: boolean;
}

export default function AuditLogViewer({ logs, loading }: AuditLogViewerProps) {
    const getActionColor = (action: string) => {
        const colors: Record<string, string> = {
            create: "bg-green-100 text-green-800",
            update: "bg-blue-100 text-blue-800",
            delete: "bg-red-100 text-red-800",
            login: "bg-purple-100 text-purple-800",
            logout: "bg-gray-100 text-gray-800",
            suspend: "bg-orange-100 text-orange-800",
            activate: "bg-teal-100 text-teal-800"
        };
        return colors[action] || "bg-gray-100 text-gray-800";
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>System-wide action history and security logs</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <p className="text-muted-foreground">Loading audit logs...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex items-center justify-center h-40">
                            <p className="text-muted-foreground">No audit logs found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Resource</TableHead>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>IP Address</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getActionColor(log.action_type)}>
                                                {log.action_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {log.resource_type}
                                            {log.resource_id && (
                                                <span className="text-xs text-muted-foreground block">
                                                    ID: {log.resource_id.substring(0, 8)}...
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">
                                            {log.user_id ? log.user_id.substring(0, 8) + "..." : "system"}
                                        </TableCell>
                                        <TableCell className="text-xs">{log.ip_address || "N/A"}</TableCell>
                                        <TableCell className="text-xs max-w-xs truncate">
                                            {log.details || "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
