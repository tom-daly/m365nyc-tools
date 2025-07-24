import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Line,
  ComposedChart
} from 'recharts';
import { TeamData } from '@/types/raffle';

interface TicketDistributionChartProps {
  teams: TeamData[];
}

interface ChartDataPoint {
  tickets: number;
  userCount: number;
  percentage: number;
  trendline?: number;
}

interface TooltipPayload {
  payload: ChartDataPoint;
  value: number;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

const TicketDistributionChart: React.FC<TicketDistributionChartProps> = ({ teams }) => {

  const chartData = useMemo(() => {
    if (!teams || teams.length === 0) return [];

    // Calculate tickets for each user (floor(Points / 100))
    const ticketCounts = teams.map(team => Math.floor(team.Points / 100));
    
    // Create frequency distribution
    const ticketFrequency = new Map<number, number>();
    ticketCounts.forEach(tickets => {
      ticketFrequency.set(tickets, (ticketFrequency.get(tickets) || 0) + 1);
    });

    // Find the range of tickets
    const minTickets = Math.min(...ticketCounts);
    const maxTickets = Math.max(...ticketCounts);

    // Create chart data with all ticket values in range
    const data: ChartDataPoint[] = [];
    for (let tickets = minTickets; tickets <= maxTickets; tickets++) {
      const userCount = ticketFrequency.get(tickets) || 0;
      const percentage = teams.length > 0 ? (userCount / teams.length) * 100 : 0;
      
      data.push({
        tickets,
        userCount,
        percentage
      });
    }

    return data;
  }, [teams]);

  // Calculate simple polynomial trendline
  const trendlineData = useMemo(() => {
    if (!chartData || chartData.length < 3) return chartData;

    // Simple moving average for smoothing
    return chartData.map((point, index) => {
      let sum = 0;
      let count = 0;
      const window = 2; // Window size for smoothing

      for (let i = Math.max(0, index - window); i <= Math.min(chartData.length - 1, index + window); i++) {
        sum += chartData[i].userCount;
        count++;
      }

      return {
        ...point,
        trendline: sum / count
      };
    });
  }, [chartData]);

  const totalUsers = teams.length;
  const averageTickets = teams.length > 0 
    ? teams.reduce((sum, team) => sum + Math.floor(team.Points / 100), 0) / teams.length 
    : 0;

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {`${data.tickets} ticket${data.tickets !== 1 ? 's' : ''}`}
          </p>
          <p className="text-blue-600 dark:text-blue-400">
            {`Users: ${data.userCount}`}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            {`${data.percentage.toFixed(1)}% of total`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!teams || teams.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Upload a CSV file to see ticket distribution
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Distribution of Tickets Among Users
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tickets calculated as floor(Points ÷ 100) with smoothed trendline
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-sm text-blue-600 dark:text-blue-400">Total Users</p>
          <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
            {totalUsers.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <p className="text-sm text-green-600 dark:text-green-400">Average Tickets</p>
          <p className="text-lg font-bold text-green-900 dark:text-green-100">
            {averageTickets.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trendlineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="tickets" 
              label={{ value: 'Number of Tickets', position: 'insideBottom', offset: -5 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis 
              label={{ value: 'Number of Players', angle: -90, position: 'insideLeft' }}
              className="text-gray-600 dark:text-gray-400"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="userCount" 
              fill="#3B82F6" 
              fillOpacity={0.8}
              stroke="#1D4ED8"
              strokeWidth={1}
              radius={[2, 2, 0, 0]}
            />
            <Line 
              type="monotone" 
              dataKey="trendline" 
              stroke="#8B5CF6" 
              strokeWidth={2}
              dot={false}
              name="Trendline"
              strokeOpacity={0.8}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Distribution Summary */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Distribution Summary
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Min Tickets:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
              {Math.min(...chartData.map(d => d.tickets))}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Max Tickets:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
              {Math.max(...chartData.map(d => d.tickets))}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Unique Ticket Counts:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
              {chartData.filter(d => d.userCount > 0).length}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total Tickets:</span>
            <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
              {teams.reduce((sum, team) => sum + Math.floor(team.Points / 100), 0)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TicketDistributionChart;
