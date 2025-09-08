import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Categories = () => {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');

  const fetchItems = async () => {
    const res = await axios.get('/api/categories');
    setItems(res.data.categories || []);
  };

  useEffect(() => { fetchItems(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    try {
      await axios.post('/api/categories', { name: name.trim() });
      setName('');
      toast.success('Category added');
      fetchItems();
    } catch (e) {
      toast.error('Add failed');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await axios.delete(`/api/categories/${id}`);
      toast.success('Deleted');
      fetchItems();
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Categories</h1>
      <div className="card mb-4">
        <div className="card-body flex space-x-2">
          <input className="input" placeholder="New category name" value={name} onChange={(e)=>setName(e.target.value)} />
          <button className="btn-primary" onClick={add}>Add</button>
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          <ul className="space-y-2">
            {items.map(i => (
              <li key={i.id} className="flex items-center justify-between border-b py-2">
                <div>
                  <div className="font-medium">{i.name}</div>
                  <div className="text-xs text-gray-500">/{i.slug}</div>
                </div>
                <button className="btn-danger" onClick={()=>remove(i.id)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Categories;


