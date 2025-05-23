import { Card} from 'antd';
import { Bar} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import Loading from '../LoadingComponent/Loading';

// Đăng ký các thành phần của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const ProductSalesChart = ({ orders, isLoading = false }) => {
  // Khi Thông tin Sản phẩm trống
  if (!orders?.data) return null;

  // Thống kê sản phẩm bán chạy
  const productSales = orders.data.reduce((acc, order) => {
    order.orderItems.forEach(item => {
      if (!acc[item.name]) {
        acc[item.name] = {
          name: item.name,
          quantity: 0,
          revenue: 0
        };
      }
      acc[item.name].quantity += item.amount;
      acc[item.name].revenue += item.amount * item.price;
    });
    return acc;
  }, {});
  // Chọn và sắp xếp Sản phẩm
  const sortedProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const data = {
    labels: sortedProducts.map(p => p.name),
    datasets: [
      {
        label: 'Số lượng bán',
        data: sortedProducts.map(p => p.quantity),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Doanh thu (VND)',
        data: sortedProducts.map(p => p.revenue),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'y1',
      }
    ],
  };

  return (
    <Loading isLoading={isLoading}>
      <Card title="Top 10 sản phẩm bán chạy" bordered={false}>
        <Bar
          data={data}
          options={{
            responsive: true,
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                  display: true,
                  text: 'Số lượng'
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                  display: true,
                  text: 'Doanh thu'
                },
                grid: {
                  drawOnChartArea: false,
                },
                ticks: {
                  callback: function (value) {
                    return (value / 1000000).toFixed(1) + 'M';
                  }
                }
              }
            }
          }}
        />
      </Card>
    </Loading>
  );
};
export default ProductSalesChart