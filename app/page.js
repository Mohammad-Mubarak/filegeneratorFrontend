// pages/index.js
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [fileType, setFileType] = useState('json');
  const [fileSize, setFileSize] = useState(1); // in MB
  const [properties, setProperties] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentProperty, setCurrentProperty] = useState(null); // For editing
  const [newProperty, setNewProperty] = useState({ id: '', name: '', type: 'string', primaryKey: false });
  const [downloadLink, setDownloadLink] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const dataTypes = ['string', 'number', 'boolean', 'date', 'email', 'phone', 'address'];

  // Load dark mode preference on mount
  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode === 'true') {
      setDarkMode(true);
    }
  }, []);

  // Update localStorage whenever darkMode changes
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle opening the modal for adding or editing
  const handleOpenModal = (property = null) => {
    if (property) {
      setCurrentProperty(property);
      setNewProperty(property);
    } else {
      setCurrentProperty(null);
      setNewProperty({ id: '', name: '', type: 'string', primaryKey: false });
    }
    setShowModal(true);
  };

  // Handle adding or updating a property
  const handleAddOrUpdateProperty = () => {
    const trimmedName = newProperty.name.trim();
    if (!trimmedName) {
      alert('Field name cannot be empty.');
      return;
    }

    // Check for unique property names excluding the current property being edited
    if (
      properties.some(
        (prop) => prop.name.toLowerCase() === trimmedName.toLowerCase() && prop.id !== newProperty.id
      )
    ) {
      alert('Field name must be unique.');
      return;
    }

    if (newProperty.type) {
      if (newProperty.primaryKey) {
        // If setting this property as primary key, unset primaryKey for all other properties
        setProperties((prev) =>
          prev.map((prop) =>
            prop.id === newProperty.id
              ? { ...newProperty, name: trimmedName }
              : { ...prop, primaryKey: false }
          )
        );
      } else {
        if (currentProperty) {
          // Update existing property
          setProperties((prev) =>
            prev.map((prop) =>
              prop.id === newProperty.id ? { ...newProperty, name: trimmedName } : prop
            )
          );
        } else {
          // Add new property
          setProperties((prev) => [
            ...prev,
            { ...newProperty, id: uuidv4(), name: trimmedName },
          ]);
        }
      }

      setNewProperty({ id: '', name: '', type: 'string', primaryKey: false });
      setCurrentProperty(null);
      setShowModal(false);
    }
  };

  // Handle deleting a property
  const handleDeleteProperty = (id) => {
    if (confirm('Are you sure you want to delete this property?')) {
      setProperties((prev) => prev.filter((prop) => prop.id !== id));
    }
  };

  // Handle toggling primary key directly from the properties list
  const handleTogglePrimaryKey = (id) => {
    setProperties((prev) =>
      prev.map((prop) =>
        prop.id === id
          ? { ...prop, primaryKey: !prop.primaryKey }
          : { ...prop, primaryKey: false }
      )
    );
  };

  // Handle drag end for reordering properties
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(properties);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setProperties(reordered);
  };

  const handleGenerate = async () => {
    if (properties.length === 0) {
      alert('Please add at least one property.');
      return;
    }

    // Ensure that one property is marked as primary key
    const hasPrimaryKey = properties.some((prop) => prop.primaryKey);
    if (!hasPrimaryKey) {
      alert('Please mark one property as the Primary Key.');
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.post('http://localhost:5000/api/generate', {
        fileType,
        fileSize,
        properties: properties.map(({ id, ...rest }) => rest), // Exclude 'id'
      }, {
        responseType: 'blob', // Important for file download
      });

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: response.headers['content-type'] })
      );
      setDownloadLink(url);
    } catch (error) {
      console.error(error);
      alert('Error generating file.');
    }
    setGenerating(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = downloadLink;
    link.download = `generated_file.${fileType}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadLink);
    setDownloadLink(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
      <div className="bg-gray-800 shadow-lg rounded-lg p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-purple-400">File Generator</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="focus:outline-none"
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? (
              // Sun Icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-9H21m-18 0H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.02 0l-.707.707M6.343 17.657l-.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              // Moon Icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
              </svg>
            )}
          </button>
        </div>

        {/* File Type and Size Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="fileType" className="block text-gray-300 mb-2">File Type:</label>
            <select
              id="fileType"
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="xml">XML</option>
            </select>
          </div>

          <div>
            <label htmlFor="fileSize" className="block text-gray-300 mb-2">File Size (MB):</label>
            <input
              type="number"
              id="fileSize"
              min="1"
              max="1000" // Example limit
              value={fileSize}
              onChange={(e) => setFileSize(Math.min(parseInt(e.target.value), 1000))}
              className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200"
            />
          </div>
        </div>

        {/* Add Property Button */}
        <div className="mb-6">
          <button
            onClick={() => handleOpenModal()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200 flex items-center justify-center"
          >
            Add Property
          </button>
        </div>

        {/* Properties List with Drag and Drop */}
        {properties.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-purple-300 mb-4">Properties:</h3>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="properties">
                {(provided) => (
                  <ul
                    className="space-y-2"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {properties.map((prop, index) => (
                      <Draggable key={prop.id} draggableId={prop.id} index={index}>
                        {(provided, snapshot) => (
                          <li
                            className={`flex items-center justify-between bg-gray-700 p-3 rounded transition-all duration-300 ${
                              snapshot.isDragging ? 'bg-gray-600' : ''
                            }`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-purple-400">{prop.name}</span> ({prop.type})
                              {prop.primaryKey && (
                                <span className="bg-yellow-500 text-gray-800 text-xs px-2 py-1 rounded-full animate-pulse">
                                  PK
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* Primary Key Checkbox */}
                              <label className="flex items-center space-x-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={prop.primaryKey}
                                  onChange={() => handleTogglePrimaryKey(prop.id)}
                                  className="h-4 w-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 transition duration-200"
                                />
                                <span className="text-gray-300 text-sm">Primary Key</span>
                              </label>

                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenModal(prop)}
                                className="text-yellow-400 hover:text-yellow-500 focus:outline-none transition duration-200"
                                aria-label="Edit Property"
                              >
                                {/* Edit Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 19l-5 1 1-5L19 7l-5 5L9 19z" />
                                </svg>
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteProperty(prop.id)}
                                className="text-red-400 hover:text-red-500 focus:outline-none transition duration-200"
                                aria-label="Delete Property"
                              >
                                {/* Delete Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </li>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {/* Generate File Button */}
        <div className="mb-6">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className={`w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200 flex items-center justify-center ${
              generating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {generating ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                Generating...
              </div>
            ) : (
              'Generate File'
            )}
          </button>
        </div>

        {/* Download File Button */}
        {downloadLink && (
          <div className="mt-4">
            <button
              onClick={handleDownload}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200"
            >
              Download File
            </button>
          </div>
        )}

        {/* Modal for Adding/Editing Property */}
        {showModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          >
            <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-sm p-6">
              <h2 id="modal-title" className="text-xl font-semibold mb-4 text-purple-300">
                {currentProperty ? 'Edit Property' : 'Add Property'}
              </h2>
              <div className="mb-4">
                <label htmlFor="fieldName" className="block text-gray-300 mb-2">
                  Field Name:
                </label>
                <input
                  type="text"
                  id="fieldName"
                  value={newProperty.name}
                  onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="dataType" className="block text-gray-300 mb-2">
                  Data Type:
                </label>
                <select
                  id="dataType"
                  value={newProperty.type}
                  onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200"
                >
                  {dataTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              {/* Remove Primary Key Checkbox from Modal */}
              {/* Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleAddOrUpdateProperty}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200"
                >
                  {currentProperty ? 'Update' : 'Add'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setNewProperty({ id: '', name: '', type: 'string', primaryKey: false });
                    setCurrentProperty(null);
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-gray-200 font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
