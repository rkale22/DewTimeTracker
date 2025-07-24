import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Typography, Card, CardContent } from '@mui/material';

interface TrackedHoursData {
  date: string;
  worked: number;
  breaks: number;
  overtime: number;
}

interface TrackedHoursBarChartProps {
  data: TrackedHoursData[];
  title: string;
  height?: number;
}

const TrackedHoursBarChart: React.FC<TrackedHoursBarChartProps> = ({ 
  data, 
  title, 
  height = 300 
}) => {
  // Format data for Recharts
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }),
    worked: item.worked,
    breaks: item.breaks,
    overtime: item.overtime,
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
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: any) => [
                  `${value}h`, 
                  name === 'worked' ? 'Worked' : 
                  name === 'breaks' ? 'Breaks' : 'Overtime'
                ]}
              />
              <Bar dataKey="worked" fill="#003366" name="Worked" />
              <Bar dataKey="breaks" fill="#C8102E" name="Breaks" />
              <Bar dataKey="overtime" fill="#ff6b35" name="Overtime" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TrackedHoursBarChart; 