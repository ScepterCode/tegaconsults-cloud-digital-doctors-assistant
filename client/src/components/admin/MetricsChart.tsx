import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MetricsData {
    cpu: {
        usage_percent: number;
        count: number;
    };
    memory: {
        total_gb: number;
        used_gb: number;
        percent: number;
    };
    disk: {
        total_gb: number;
        used_gb: number;
        percent: number;
    };
}

interface MetricsChartProps {
    metrics: MetricsData | null;
    historicalData?: any[];
}

export default function MetricsChart({ metrics, historicalData }: MetricsChartProps) {
    if (!metrics) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                        Loading metrics...
                    </div>
                </CardContent>
            </Card>
        );
    }

    const currentData = [
        { name: "CPU", value: metrics.cpu.usage_percent, color: "#3b82f6" },
        { name: "Memory", value: metrics.memory.percent, color: "#8b5cf6" },
        { name: "Disk", value: metrics.disk.percent, color: "#10b981" }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {/* CPU Usage */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">CPU Usage</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold">{metrics.cpu.usage_percent.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">{metrics.cpu.count} cores</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${metrics.cpu.usage_percent}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Memory Usage</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold">{metrics.memory.percent.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">
                                {metrics.memory.used_gb.toFixed(1)} / {metrics.memory.total_gb.toFixed(1)} GB
                            </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-purple-600 h-2 rounded-full transition-all"
                                style={{ width: `${metrics.memory.percent}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Disk Usage */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Disk Usage</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold">{metrics.disk.percent.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">
                                {metrics.disk.used_gb.toFixed(1)} / {metrics.disk.total_gb.toFixed(1)} GB
                            </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{ width: `${metrics.disk.percent}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
