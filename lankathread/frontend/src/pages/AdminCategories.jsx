
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Badge, Table } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiFolder, FiChevronRight, FiPin, FiPinOff, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { categoryAPI } from '../services/api';
import { toast } from 'react-toastify';

const AdminCategories = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    active: true,
    displayOrder: 0,
    isPinned: false,
    parentId: null
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!isAdmin()) {
      navigate('/');
      return;
    }
    fetchCategories();
  }, [user]);

  const fetchCategories = async () => {
    try {
      const res = await categoryAPI.getAll();
      if (res.data.success) {
        const allCategories = res.data.data || [];
        const parentCategories = allCategories.filter(cat => !cat.parent);
        setCategories(parentCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    }
  };

  const fetchSubcategories = async (parentId) => {
    try {
      const res = await categoryAPI.getSubcategories(parentId);
      if (res.data.success) {
        setSubcategories(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubcategories([]);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    fetchSubcategories(category.id);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSubcategories([]);
  };

  const openModal = (category = null, isSubcategory = false) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        imageUrl: category.imageUrl || '',
        active: category.active ?? true,
        displayOrder: category.displayOrder || 0,
        isPinned: category.isPinned || false,
        parentId: isSubcategory ? (selectedCategory?.id || category.parent?.id) : null
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        active: true,
        displayOrder: 0,
        isPinned: false,
        parentId: isSubcategory ? selectedCategory?.id : null
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCategoryForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveCategory = async () => {
    try {
      const payload = {
        name: categoryForm.name,
        slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
        description: categoryForm.description,
        imageUrl: categoryForm.imageUrl,
        active: categoryForm.active,
        displayOrder: Number(categoryForm.displayOrder),
        isPinned: categoryForm.isPinned,
        parent: categoryForm.parentId ? { id: Number(categoryForm.parentId) } : null
      };

      if (editingCategory && editingCategory.id) {
        await categoryAPI.update(editingCategory.id, payload);
        toast.success('Category updated');
      } else {
        await categoryAPI.create(payload);
        toast.success('Category created');
      }
      closeModal();
      fetchCategories();
      if (selectedCategory) {
        fetchSubcategories(selectedCategory.id);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category? This will also delete all subcategories.')) return;
    try {
      await categoryAPI.delete(categoryId);
      toast.success('Category deleted');
      fetchCategories();
      if (selectedCategory && selectedCategory.id === categoryId) {
        setSelectedCategory(null);
        setSubcategories([]);
      } else if (selectedCategory) {
        fetchSubcategories(selectedCategory.id);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const handlePinCategory = async (categoryId, pin) => {
    try {
      if (pin) {
        await categoryAPI.pin(categoryId);
        toast.success('Category pinned');
      } else {
        await categoryAPI.unpin(categoryId);
        toast.success('Category unpinned');
      }
      fetchCategories();
    } catch (error) {
      console.error('Error pinning category:', error);
      toast.error('Failed to pin/unpin category');
    }
  };

  if (!user || !isAdmin()) {
    return (
      <Container className="py-5 text-center">
        <h3>Access Denied</h3>
        <p>Please login as admin to access this page</p>
        <Button as={Link} to="/login" className="btn-primary-custom">
          Sign In
        </Button>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 admin-dashboard">
      <Row>
        {/* Sidebar */}
        <Col lg={2} className="admin-sidebar d-none d-lg-block">
          <div className="sidebar-menu">
            <h5 className="sidebar-brand mb-4">
              <span className="brand-lanka">Lanka</span>
              <span className="brand-thread">Thread</span>
            </h5>
            <nav className="nav flex-column">
              <button className="nav-link" onClick={() => navigate('/admin')}>
                <FiFolder className="me-2" /> Dashboard
              </button>
              <button className="nav-link active" onClick={() => navigate('/admin/categories')}>
                <FiFolder className="me-2" /> Categories
              </button>
              <button className="nav-link" onClick={() => navigate('/admin')}>
                <FiFolder className="me-2" /> Products
              </button>
              <button className="nav-link" onClick={() => navigate('/admin')}>
                <FiFolder className="me-2" /> Orders
              </button>
            </nav>
          </div>
        </Col>

        {/* Main Content */}
        <Col lg={10}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <Button variant="link" className="p-0 mb-2" onClick={() => navigate('/admin')}>
                <FiArrowLeft className="me-1" /> Back to Dashboard
              </Button>
              <h4 className="mb-0">
                {selectedCategory ? (
                  <>
                    {selectedCategory.name} <FiChevronRight className="mx-2" /> Subcategories
                  </>
                ) : (
                  'Category Management'
                )}
              </h4>
            </div>
            <Button className="btn-primary-custom" onClick={() => openModal(null, !!selectedCategory)}>
              <FiPlus className="me-2" /> {selectedCategory ? 'Add Subcategory' : 'Add Category'}
            </Button>
          </div>

          <Card>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="admin-table mb-0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Description</th>
                      <th>Display Order</th>
                      <th>Status</th>
                      <th>Pinned</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedCategory ? subcategories : categories).map(category => (
                      <tr key={category.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            {!selectedCategory && (
                              <Button
                                variant="link"
                                className="p-0 me-2 text-primary"
                                onClick={() => handleCategoryClick(category)}
                              >
                                <FiFolder />
                              </Button>
                            )}
                            <span>{category.name}</span>
                          </div>
                        </td>
                        <td><small className="text-muted">{category.slug}</small></td>
                        <td><small className="text-muted">{category.description || '-'}</small></td>
                        <td>{category.displayOrder}</td>
                        <td>
                          <Badge bg={category.active ? 'success' : 'secondary'}>
                            {category.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="link"
                            className="p-0"
                            onClick={() => handlePinCategory(category.id, !category.isPinned)}
                            title={category.isPinned ? 'Unpin' : 'Pin'}
                          >
                            {category.isPinned ? <FiPin className="text-primary" /> : <FiPinOff className="text-muted" />}
                          </Button>
                        </td>
                        <td>
                          <Button variant="link" className="p-0 me-1" onClick={() => openModal(category, !!selectedCategory)} title="Edit">
                            <FiEdit2 size={16} />
                          </Button>
                          <Button variant="link" className="p-0 text-danger" onClick={() => handleDeleteCategory(category.id)} title="Delete">
                            <FiTrash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {(selectedCategory ? subcategories : categories).length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          {selectedCategory ? 'No subcategories found' : 'No categories found'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {selectedCategory && (
            <div className="mt-3">
              <Button variant="outline-secondary" onClick={handleBackToCategories}>
                <FiArrowLeft className="me-2" /> Back to Main Categories
              </Button>
            </div>
          )}
        </Col>
      </Row>

      {/* Category Modal */}
      <Modal show={showModal} onHide={closeModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCategory ? 'Edit' : 'Add'} {selectedCategory ? 'Subcategory' : 'Category'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Category Name *</Form.Label>
              <Form.Control
                name="name"
                value={categoryForm.name}
                onChange={handleFormChange}
                placeholder="Enter category name"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Slug</Form.Label>
              <Form.Control
                name="slug"
                value={categoryForm.slug}
                onChange={handleFormChange}
                placeholder="URL-friendly name (auto-generated if empty)"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={categoryForm.description}
                onChange={handleFormChange}
                placeholder="Category description"
                rows={3}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                name="imageUrl"
                value={categoryForm.imageUrl}
                onChange={handleFormChange}
                placeholder="https://example.com/image.jpg"
              />
            </Form.Group>
            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Display Order</Form.Label>
                  <Form.Control
                    type="number"
                    name="displayOrder"
                    value={categoryForm.displayOrder}
                    onChange={handleFormChange}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Check
                  type="checkbox"
                  name="active"
                  label="Active"
                  checked={categoryForm.active}
                  onChange={handleFormChange}
                />
              </Col>
            </Row>
            {!selectedCategory && (
              <Form.Check
                type="checkbox"
                name="isPinned"
                label="Pin to Navigation Bar"
                checked={categoryForm.isPinned}
                onChange={handleFormChange}
                className="mb-3"
              />
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button className="btn-primary-custom" onClick={handleSaveCategory}>
            {editingCategory ? 'Update' : 'Create'} Category
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminCategories;
