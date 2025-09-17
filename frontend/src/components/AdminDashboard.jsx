'use client'

import React from 'react';
import { BarChart3, Package, Users, Plus, Settings } from 'lucide-react';

const AdminDashboard = ({ setCurrentScreen, slideIn }) => (
  <div className={`min-h-screen bg-gray-50 ${slideIn}`}>
    <div className="bg-white p-6 border-b border-gray-100">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 text-sm font-medium">Manage inventory & sales</p>
        </div>
        <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
          <Package className="w-6 h-6 text-yellow-600" />
        </div>
      </div>
    </div>

    <div className="p-6">
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">₹12,450</span>
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Today's Sales</h3>
          <p className="text-xs text-gray-600 font-medium mt-1">+15% from yesterday</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">156</span>
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Products Sold</h3>
          <p className="text-xs text-gray-600 font-medium mt-1">+8% from yesterday</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center transform transition-all duration-200 hover:bg-yellow-100 active:scale-95">
            <Plus className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="font-bold text-gray-900 text-sm">Add Product</p>
          </button>
          <button className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center transform transition-all duration-200 hover:bg-blue-100 active:scale-95">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="font-bold text-gray-900 text-sm">Manage Stock</p>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: 'Product added', item: 'Tata Salt 1kg', time: '2 mins ago' },
            { action: 'Stock updated', item: 'Maggi Noodles', time: '15 mins ago' },
            { action: 'Sale completed', item: '₹195 transaction', time: '23 mins ago' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="font-bold text-gray-900 text-sm">{activity.action}</p>
                <p className="text-xs text-gray-600">{activity.item}</p>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default AdminDashboard;

