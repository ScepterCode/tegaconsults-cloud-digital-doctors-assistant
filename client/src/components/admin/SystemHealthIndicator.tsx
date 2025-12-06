import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, XCircle, Activity } from "lucide-react";

interface SystemHealth {
    status: string;
    timestamp: string;
    issues: string[];
    services: {
        database: string;
        api: string;
    };
}

interface SystemHealthIndicatorProps {
    health: SystemHealth | null;
    loading?: boolean;
}

export default function SystemHealthIndicator({ health, loading }: SystemHealthIndicatorProps) {
    if (loading || !health) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-20">
                        <Activity className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "healthy":
                return <CheckCircle2 className="h-8 w-8 text-green-500" />;
            case "warning":
                return <AlertCircle className="h-8 w-8 text-yellow-500" />;
            case "critical":
            case "error":
                return <XCircle className="h-8 w-8 text-red-500" />;
            default:
                return <Activity className="h-8 w-8 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "healthy":
                return "bg-green-100 text-green-800 border-green-200";
            case "warning":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "critical":
            case "error":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {getStatusIcon(health.status)}
                        <div>
                            <Badge className={`${getStatusColor(health.status)} border`}>
                                {health.status.toUpperCase()}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                                Last checked: {new Date(health.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                </div>

                {health.issues && health.issues.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-xs font-semibold text-yellow-800 mb-1">Issues Detected:</p>
                        {health.issues.map((issue, idx) => (
                            <p key={idx} className="text-xs text-yellow-700">• {issue}</p>
                        ))}
                    </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${health.services.database === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-muted-foreground">Database</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${health.services.api === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-muted-foreground">API</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
