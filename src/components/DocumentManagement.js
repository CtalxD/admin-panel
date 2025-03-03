import React, { useEffect, useState } from 'react';
import '../styles/documentManagement.css';

/**
 * @typedef {Object} Document
 * @property {number} id
 * @property {number} userId
 * @property {string} name
 * @property {string} email
 * @property {string} role
 * @property {string} documentUrl
 * @property {string} status
 */

/**
 * DocumentManagement Component
 */
const DocumentManagement = () => {
  /** @type {[Document[], React.Dispatch<React.SetStateAction<Document[]>>]} */
  const [documents, setDocuments] = useState([]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const updateDocumentStatus = async (id, status) => {
    try {
      await fetch(`http://localhost:5000/api/documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchDocuments(); // Refresh data after updating status
    } catch (error) {
      console.error(`Error updating document status for ID ${id}:`, error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="document-management-container">
      <h2 className="document-management-title">Document Management</h2>
      <div className="document-table-container">
        <table className="document-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Uploaded Document</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.userId}</td>
                  <td>{doc.name}</td>
                  <td>{doc.email}</td>
                  <td>{doc.role}</td>
                  <td>
                    <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer">
                      <img
                        src={doc.documentUrl}
                        alt={`Document of ${doc.name}`}
                        className="document-thumbnail"
                      />
                    </a>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        doc.status === 'Approved' ? 'status-approved' : 'status-pending'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="approve-button"
                      onClick={() => updateDocumentStatus(doc.id, 'Approved')}
                    >
                      Approve
                    </button>
                    <button
                      className="reject-button"
                      onClick={() => updateDocumentStatus(doc.id, 'Rejected')}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="no-data">
                  No documents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentManagement;


