import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Search, X, Users, Mail, Phone, Briefcase, Building2, Calendar, AlertCircle, CheckCircle, Wifi } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080/Person_backend/api/persons';

// ==================== API FUNCTIONS ====================

// 1. Get all persons
const getAllPersons = async () => {
  try {
    const response = await fetch(API_BASE_URL);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching all persons:', error);
    throw error;
  }
};

// 2. Get person by ID
const getPersonById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Person with ID ${id} not found`);
      }
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching person with ID ${id}:`, error);
    throw error;
  }
};

// 3. Search persons by name
const searchPersonsByName = async (name) => {
  try {
    const response = await fetch(`${API_BASE_URL}/search?name=${encodeURIComponent(name)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error searching persons by name "${name}":`, error);
    throw error;
  }
};

// 4. Search persons by department
const searchPersonsByDepartment = async (department) => {
  try {
    const response = await fetch(`${API_BASE_URL}/department?name=${encodeURIComponent(department)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error searching persons by department "${department}":`, error);
    throw error;
  }
};

// 5. Create new person
const createPerson = async (personData) => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(personData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (errorText) errorMessage = errorText;
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating person:', error);
    throw error;
  }
};

// 6. Update person (full update with PUT)
const updatePerson = async (id, personData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(personData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (errorText) errorMessage = errorText;
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating person with ID ${id}:`, error);
    throw error;
  }
};

// 7. Delete person
const deletePerson = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    
    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return { success: true, message: 'Person deleted successfully' };
  } catch (error) {
    console.error(`Error deleting person with ID ${id}:`, error);
    throw error;
  }
};

// 8. Get persons count
const getPersonsCount = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/count`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting persons count:', error);
    throw error;
  }
};

// 9. Test API connection
const testApiConnection = async () => {
  try {
    const response = await fetch(API_BASE_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      message: `✅ Connection successful! Found ${data.length} persons.`,
      data: data
    };
  } catch (error) {
    console.error('API connection test failed:', error);
    
    // Check for CORS errors
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error(`❌ CORS/Network error. Check if:
        1. Backend is running on http://localhost:8080
        2. CORS is properly configured
        3. You can access ${API_BASE_URL} in browser`);
    }
    
    throw error;
  }
};

// ==================== REACT COMPONENT ====================

export default function PersonManagementApp() {
  // State declarations
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    poste: '',
    departement: '',
    dateEmbauche: ''
  });

  // ==================== DATA FETCHING FUNCTIONS ====================

  const handleFetchAllPersons = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllPersons();
      setPersons(data);
    } catch (err) {
      setError(`Failed to load persons: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchPersons = useCallback(async () => {
    if (!searchTerm.trim()) {
      handleFetchAllPersons();
      return;
    }

    setLoading(true);
    setError('');
    try {
      let data;
      if (searchType === 'name') {
        data = await searchPersonsByName(searchTerm.trim());
      } else {
        data = await searchPersonsByDepartment(searchTerm.trim());
      }
      setPersons(data || []);
    } catch (err) {
      setError(`Search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, searchType, handleFetchAllPersons]);

  const handleCreatePerson = async (personData) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Validate required fields
      const requiredFields = ['name', 'age', 'nom', 'prenom', 'email'];
      for (const field of requiredFields) {
        if (!personData[field]?.toString().trim()) {
          throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personData.email.trim())) {
        throw new Error('Please enter a valid email address');
      }

      // Age validation
      const age = parseInt(personData.age);
      if (isNaN(age) || age <= 0) {
        throw new Error('Age must be a positive number');
      }

      // Prepare payload
      const payload = {
        ...personData,
        age: age,
        name: personData.name.trim(),
        nom: personData.nom.trim(),
        prenom: personData.prenom.trim(),
        email: personData.email.trim(),
        telephone: personData.telephone?.trim() || '',
        poste: personData.poste?.trim() || '',
        departement: personData.departement?.trim() || '',
        dateEmbauche: personData.dateEmbauche || ''
      };

      const result = await createPerson(payload);
      setSuccessMessage('Person created successfully!');
      handleFetchAllPersons();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePerson = async (id, personData) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Validate required fields
      const requiredFields = ['name', 'age', 'nom', 'prenom', 'email'];
      for (const field of requiredFields) {
        if (!personData[field]?.toString().trim()) {
          throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personData.email.trim())) {
        throw new Error('Please enter a valid email address');
      }

      // Age validation
      const age = parseInt(personData.age);
      if (isNaN(age) || age <= 0) {
        throw new Error('Age must be a positive number');
      }

      // Prepare payload
      const payload = {
        ...personData,
        age: age,
        name: personData.name.trim(),
        nom: personData.nom.trim(),
        prenom: personData.prenom.trim(),
        email: personData.email.trim(),
        telephone: personData.telephone?.trim() || '',
        poste: personData.poste?.trim() || '',
        departement: personData.departement?.trim() || '',
        dateEmbauche: personData.dateEmbauche || ''
      };

      const result = await updatePerson(id, payload);
      setSuccessMessage('Person updated successfully!');
      handleFetchAllPersons();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePerson = async (id) => {
    if (!window.confirm('Are you sure you want to delete this person?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const result = await deletePerson(id);
      setSuccessMessage('Person deleted successfully!');
      handleFetchAllPersons();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleGetPersonById = async (id) => {
    setLoading(true);
    setError('');
    
    try {
      const person = await getPersonById(id);
      return person;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleGetPersonsCount = async () => {
    try {
      const result = await getPersonsCount();
      setSuccessMessage(`Total persons in database: ${result.count}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const result = await testApiConnection();
      setSuccessMessage(result.message);
      handleFetchAllPersons();
      setTimeout(() => setSuccessMessage(''), 3000);
      return result;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== UI EVENT HANDLERS ====================

  useEffect(() => {
    handleFetchAllPersons();
  }, [handleFetchAllPersons]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearchPersons();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, handleSearchPersons]);

  const handleEditClick = async (person) => {
    try {
      // Option 1: Use the person object directly from the list
      setEditingPerson(person);
      setFormData({
        name: person.name || '',
        age: person.age?.toString() || '',
        nom: person.nom || '',
        prenom: person.prenom || '',
        email: person.email || '',
        telephone: person.telephone || '',
        poste: person.poste || '',
        departement: person.departement || '',
        dateEmbauche: person.dateEmbauche || ''
      });
      
      // Option 2: Fetch fresh data from API
      // const freshPerson = await handleGetPersonById(person.id);
      // setEditingPerson(freshPerson);
      // setFormData({ ...freshPerson, age: freshPerson.age?.toString() || '' });
      
      setShowModal(true);
    } catch (err) {
      setError(`Failed to load person details: ${err.message}`);
    }
  };

  const handleSubmitForm = async () => {
    try {
      if (editingPerson) {
        await handleUpdatePerson(editingPerson.id, formData);
      } else {
        await handleCreatePerson(formData);
      }
      handleCloseModal();
    } catch (err) {
      // Error is already set in the handler functions
    }
  };

  const handleDeleteClick = async (id) => {
    try {
      await handleDeletePerson(id);
    } catch (err) {
      // Error is already set in the handler functions
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPerson(null);
    setFormData({
      name: '',
      age: '',
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      poste: '',
      departement: '',
      dateEmbauche: ''
    });
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    handleFetchAllPersons();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderPersonCard = (person) => (
    <div key={person.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-100">
      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 h-2"></div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{person.name}</h3>
            <p className="text-gray-600">{person.prenom} {person.nom}</p>
            <span className="inline-block mt-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
              Age: {person.age}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleEditClick(person)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteClick(person.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-800 truncate">{person.email}</p>
            </div>
          </div>

          {person.telephone && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-800">{person.telephone}</p>
              </div>
            </div>
          )}

          {person.poste && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Briefcase className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Position</p>
                <p className="text-sm font-medium text-gray-800">{person.poste}</p>
              </div>
            </div>
          )}

          {person.departement && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Building2 className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="text-sm font-medium text-gray-800">{person.departement}</p>
              </div>
            </div>
          )}

          {person.dateEmbauche && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-50 rounded-lg">
                <Calendar className="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Hire Date</p>
                <p className="text-sm font-medium text-gray-800">{formatDate(person.dateEmbauche)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">ID: {person.id}</p>
        </div>
      </div>
    </div>
  );

  const renderMessage = (type, message) => {
    if (!message) return null;
    
    const config = {
      error: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: <AlertCircle className="w-5 h-5 text-red-500" />
      },
      success: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: <CheckCircle className="w-5 h-5 text-green-500" />
      }
    }[type];

    return (
      <div className={`mb-6 p-4 ${config.bg} border ${config.border} rounded-lg`}>
        <div className="flex items-start gap-3">
          {config.icon}
          <div className="flex-1">
            <p className={`font-medium ${config.text}`}>{message}</p>
          </div>
          <button
            onClick={() => type === 'error' ? setError('') : setSuccessMessage('')}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // ==================== MAIN RENDER ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Person Management System</h1>
                <p className="text-gray-600 text-sm">Manage your personnel database efficiently</p>
                <p className="text-xs text-gray-500 mt-1">API: {API_BASE_URL}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleTestConnection}
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Wifi className="w-4 h-4" />
                {loading ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={handleGetPersonsCount}
                disabled={loading}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Get Count
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Person
              </button>
            </div>
          </div>

          {/* Search Section */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  <label className="text-sm font-medium text-gray-700">Search Persons</label>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder={`Search by ${searchType === 'name' ? 'name' : 'department'}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchPersons()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleSearchPersons}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Search
                  </button>
                  {searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSearchType('name')}
                    className={`px-4 py-2 rounded-lg transition-colors ${searchType === 'name' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    By Name
                  </button>
                  <button
                    onClick={() => setSearchType('department')}
                    className={`px-4 py-2 rounded-lg transition-colors ${searchType === 'department' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    By Department
                  </button>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Available API Endpoints:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">GET /persons</code>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">POST /persons</code>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">GET /persons/search</code>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">GET /persons/department</code>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">GET /persons/count</code>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {renderMessage('error', error)}
        {renderMessage('success', successMessage)}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-gray-600 mb-2">Total Persons</p>
            <p className="text-3xl font-bold text-indigo-600">{persons.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-gray-600 mb-2">Search Type</p>
            <p className="text-xl font-bold text-blue-600 capitalize">{searchType}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-gray-600 mb-2">Status</p>
            <p className={`text-xl font-bold ${loading ? 'text-yellow-600' : persons.length > 0 ? 'text-green-600' : 'text-gray-600'}`}>
              {loading ? 'Loading...' : persons.length > 0 ? 'Connected' : 'Ready'}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading data...</p>
          </div>
        )}

        {/* Persons Grid */}
        {!loading && persons.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No persons found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? `No results for "${searchTerm}"` : 'Start by adding your first person'}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-2" /> Add First Person
              </button>
              <button
                onClick={handleTestConnection}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Test Connection
              </button>
            </div>
          </div>
        ) : !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {persons.map(renderPersonCard)}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {editingPerson ? 'Edit Person' : 'Add New Person'}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      {editingPerson ? 'Update person details' : 'Fill in the required information'}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {[
                    { name: 'name', label: 'Name *', type: 'text' },
                    { name: 'age', label: 'Age *', type: 'number', min: 1 },
                    { name: 'nom', label: 'Nom (Last Name) *', type: 'text' },
                    { name: 'prenom', label: 'Prenom (First Name) *', type: 'text' },
                    { name: 'email', label: 'Email *', type: 'email' },
                    { name: 'telephone', label: 'Phone', type: 'tel' },
                    { name: 'poste', label: 'Position', type: 'text' },
                    { name: 'departement', label: 'Department', type: 'text' },
                  ].map(field => (
                    <div key={field.name} className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleInputChange}
                        min={field.min}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required={field.label.includes('*')}
                      />
                    </div>
                  ))}
                  
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Hire Date (yyyy-mm-dd)
                    </label>
                    <input
                      type="date"
                      name="dateEmbauche"
                      value={formData.dateEmbauche}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Format: yyyy-mm-dd (e.g., 2024-01-15)</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSubmitForm}
                    disabled={loading}
                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {editingPerson ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : editingPerson ? 'Update Person' : 'Create Person'}
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Form Validation Rules:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Fields marked with * are required</li>
                    <li>• Email must be in valid format</li>
                    <li>• Age must be a positive number</li>
                    <li>• Email must be unique (not already in database)</li>
                    <li>• Hire date must be in yyyy-mm-dd format</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Backend API: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{API_BASE_URL}</code></p>
          <p className="mt-2">Built with React • Connected to Java/Jersey Backend</p>
          <div className="mt-4 flex gap-2 justify-center">
            <button
              onClick={() => window.open(API_BASE_URL, '_blank')}
              className="text-xs px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Test API in Browser
            </button>
            <button
              onClick={() => {
                console.log('Current persons:', persons);
                console.log('Current state:', { loading, error, successMessage, searchTerm, searchType });
              }}
              className="text-xs px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Show Debug Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}