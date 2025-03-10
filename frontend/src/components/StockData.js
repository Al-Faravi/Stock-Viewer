import React, { useEffect, useState, useMemo } from 'react';
import { TextField, Button, Dialog, DialogActions, DialogContent, DialogTitle, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, CircularProgress, Snackbar } from '@mui/material';
import { debounce } from 'lodash'; // For debounce functionality
import './StockData.css'; // Import your custom CSS

const StockData = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStock, setEditingStock] = useState(null);
  const [newStock, setNewStock] = useState({
    date: '',
    trade_code: '',
    high: '',
    low: '',
    open: '',
    close: '',
    volume: '',
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [notification, setNotification] = useState(null); // Success or error message for notifications
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('date');

  useEffect(() => {
    fetch('http://localhost:5000/api/stock_data')
      .then((response) => response.json())
      .then((data) => {
        setStocks(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Error fetching stock data');
        setLoading(false);
      });
  }, []);

  // Debounce search term to reduce the number of re-renders
  const debouncedSearch = useMemo(() => debounce(setSearchTerm, 500), []);

  const handleSearchChange = (event) => {
    debouncedSearch(event.target.value);
  };

  // Filter and sort the stock data
  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) =>
      stock.trade_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stocks, searchTerm]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // UseMemo to avoid re-sorting on each render
  const sortedStocks = useMemo(() => {
    return filteredStocks.sort((a, b) => {
      if (orderBy === 'date') {
        return order === 'asc'
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      }
      return 0;
    });
  }, [filteredStocks, order, orderBy]);

  const handleAddStock = () => {
    fetch('http://localhost:5000/api/stock_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newStock),
    })
      .then((response) => response.json())
      .then((data) => {
        setStocks((prevStocks) => [...prevStocks, data]);
        setNotification('Stock added successfully!');
        setOpenDialog(false);
        setNewStock({
          date: '',
          trade_code: '',
          high: '',
          low: '',
          open: '',
          close: '',
          volume: '',
        });
      })
      .catch((err) => {
        setNotification('Error adding stock.');
        console.error('Error adding stock:', err);
      });
  };

  const handleEditStock = (stock) => {
    setEditingStock(stock);
    setOpenDialog(true);
  };

  const handleUpdateStock = () => {
    fetch(`http://localhost:5000/api/stock_data/${editingStock.trade_code}/${editingStock.date}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editingStock),
    })
      .then((response) => response.json())
      .then((data) => {
        setStocks((prevStocks) =>
          prevStocks.map((stock) =>
            stock.trade_code === data.trade_code && stock.date === data.date ? data : stock
          )
        );
        setNotification('Stock updated successfully!');
        setOpenDialog(false);
        setEditingStock(null);
      })
      .catch((err) => {
        setNotification('Error updating stock.');
        console.error('Error updating stock:', err);
      });
  };

  const handleDeleteStock = (tradeCode, date) => {
    if (window.confirm('Are you sure you want to delete this stock?')) {
      fetch(`http://localhost:5000/api/stock_data/${tradeCode}/${date}`, {
        method: 'DELETE',
      })
        .then(() => {
          setStocks((prevStocks) =>
            prevStocks.filter((stock) => stock.trade_code !== tradeCode || stock.date !== date)
          );
          setNotification('Stock deleted successfully!');
        })
        .catch((err) => {
          setNotification('Error deleting stock.');
          console.error('Error deleting stock:', err);
        });
    }
  };

  const handleCloseSnackbar = () => {
    setNotification(null);
  };

  if (loading) return <div className="loading"><CircularProgress /></div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="stock-container">
      <h2>Stock Data</h2>

      <div className="search-container">
        <TextField
          label="Search by Trade Code"
          variant="outlined"
          onChange={handleSearchChange}
          className="search-box"
        />
        <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)}>
          Add Stock
        </Button>
      </div>

      <TableContainer>
        <Table className="stock-table" aria-label="stock data">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'date'}
                  direction={orderBy === 'date' ? order : 'asc'}
                  onClick={() => handleRequestSort('date')}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell>Trade Code</TableCell>
              <TableCell>High</TableCell>
              <TableCell>Low</TableCell>
              <TableCell>Open</TableCell>
              <TableCell>Close</TableCell>
              <TableCell>Volume</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedStocks.map((stock) => (
              <TableRow key={`${stock.date}-${stock.trade_code}`}>
                <TableCell>{stock.date}</TableCell>
                <TableCell>{stock.trade_code}</TableCell>
                <TableCell>{stock.high}</TableCell>
                <TableCell>{stock.low}</TableCell>
                <TableCell>{stock.open}</TableCell>
                <TableCell>{stock.close}</TableCell>
                <TableCell>{stock.volume}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleEditStock(stock)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDeleteStock(stock.trade_code, stock.date)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Add/Edit Stock */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{editingStock ? 'Edit Stock' : 'Add New Stock'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Date"
            variant="outlined"
            fullWidth
            value={editingStock ? editingStock.date : newStock.date}
            onChange={(e) => (editingStock ? setEditingStock({ ...editingStock, date: e.target.value }) : setNewStock({ ...newStock, date: e.target.value }))}
            margin="normal"
          />
          <TextField
            label="Trade Code"
            variant="outlined"
            fullWidth
            value={editingStock ? editingStock.trade_code : newStock.trade_code}
            onChange={(e) => (editingStock ? setEditingStock({ ...editingStock, trade_code: e.target.value }) : setNewStock({ ...newStock, trade_code: e.target.value }))}
            margin="normal"
          />
          <TextField
            label="High"
            variant="outlined"
            fullWidth
            value={editingStock ? editingStock.high : newStock.high}
            onChange={(e) => (editingStock ? setEditingStock({ ...editingStock, high: e.target.value }) : setNewStock({ ...newStock, high: e.target.value }))}
            margin="normal"
          />
          <TextField
            label="Low"
            variant="outlined"
            fullWidth
            value={editingStock ? editingStock.low : newStock.low}
            onChange={(e) => (editingStock ? setEditingStock({ ...editingStock, low: e.target.value }) : setNewStock({ ...newStock, low: e.target.value }))}
            margin="normal"
          />
          <TextField
            label="Open"
            variant="outlined"
            fullWidth
            value={editingStock ? editingStock.open : newStock.open}
            onChange={(e) => (editingStock ? setEditingStock({ ...editingStock, open: e.target.value }) : setNewStock({ ...newStock, open: e.target.value }))}
            margin="normal"
          />
          <TextField
            label="Close"
            variant="outlined"
            fullWidth
            value={editingStock ? editingStock.close : newStock.close}
            onChange={(e) => (editingStock ? setEditingStock({ ...editingStock, close: e.target.value }) : setNewStock({ ...newStock, close: e.target.value }))}
            margin="normal"
          />
          <TextField
            label="Volume"
            variant="outlined"
            fullWidth
            value={editingStock ? editingStock.volume : newStock.volume}
            onChange={(e) => (editingStock ? setEditingStock({ ...editingStock, volume: e.target.value }) : setNewStock({ ...newStock, volume: e.target.value }))}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">Cancel</Button>
          <Button onClick={editingStock ? handleUpdateStock : handleAddStock} color="primary">
            {editingStock ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={notification !== null}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={notification}
      />
    </div>
  );
};

export default StockData;
