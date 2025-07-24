import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Typography, Card, CardContent } from '@mui/material';

interface TeamHoursData {
  employee: string;
  date: string;
  worked: number;
}

interface TeamHoursBarChartProps {
  data: TeamHoursData[];
  title: string;
  height?: number;
}

const TeamHoursBarChart: React.FC<TeamHoursBarChartProps> = ({ 
  data, 
  title, 
  height = 300 
}) => {
  // Group data by employee and sum their hours
  const employeeHours = data.reduce((acc, item) => {
    if (!acc[item.employee]) {
      acc[item.employee] = 0;
    }
    acc[item.employee] += item.worked;
    return acc;
  }, {} as Record<string, number>);

  // Convert to chart format
  const chartData = Object.entries(employeeHours).map(([employee, hours]) => ({
    employee,
    hours: Math.round(hours * 10) / 10, // Round to 1 decimal place
  }));

  return (
    <Card sx={{ 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(0, 51, 102, 0.1)'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#003366' }}>
          {title}
        </Typography>
        <Box sx={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="employee" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value}h`, 'Hours Worked']}
              />
              <Bar dataKey="hours" fill="#4a90e2" name="Hours Worked" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TeamHoursBarChart; 