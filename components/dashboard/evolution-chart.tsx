"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface EvolutionChartProps {
    data: any[]
    onPointClick?: (data: any) => void
}

export default function EvolutionChart({ data, onPointClick }: EvolutionChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Evolución</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-gray-500">
                    No hay suficientes datos aún
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tu Progreso</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="label"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}%`}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="accuracy"
                            stroke="#8884d8"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#8884d8", cursor: 'pointer' }}
                            activeDot={{ r: 6, cursor: 'pointer', onClick: (e: any, payload: any) => onPointClick && onPointClick(payload.payload) }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
