import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

ChartJS.defaults.font.family = 'Montserrat, sans-serif'; // Global setting

const BarChart = (chartData,title,legendBool) => {
    const options = {
        plugins: {
          title: {
            display: true,
            text: title,
            padding: {
                bottom: 20,
              },
            font: {
                size: 24,
              },
          },
          legend: {
            display: legendBool
          },
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'top',
            formatter: (value, context) => {
              return value;
            },
            font: {
              weight: 'bold',
              size: 15,
            }
          }
        },
        responsive: true,
        scales: {
            x: {
              stacked: true,
            },
            y: {
              stacked: true,
              ticks: {
                stepSize: 1,
              },
            },
          },
      };
  return (<Bar options={options} plugins={[ChartDataLabels]} data={chartData} />)
}

export default BarChart;
