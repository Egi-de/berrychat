import { useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export default function AddContactModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const handleAddContact = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (email === currentUser.email) {
        setError("❌ You cannot add yourself as a contact.");
        setLoading(false);
        return;
      }

      // Find user by email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("⚠️ User not found.");
        setLoading(false);
        return;
      }

      let userToAdd = null;
      querySnapshot.forEach((doc) => {
        userToAdd = { id: doc.id, ...doc.data() };
      });

      if (!userToAdd) {
        setError("⚠️ Something went wrong, user not found.");
        setLoading(false);
        return;
      }

      // Check if contact already exists
      const contactsRef = collection(db, "users", currentUser.uid, "contacts");
      const existingContactQ = query(
        contactsRef,
        where("email", "==", userToAdd.email)
      );
      const existingContactSnapshot = await getDocs(existingContactQ);

      if (!existingContactSnapshot.empty) {
        setError("ℹ️ This contact is already in your list.");
        setLoading(false);
        return;
      }

      // Add contact
      await addDoc(contactsRef, {
        email: userToAdd.email,
        uid: userToAdd.id,
      });

      setEmail("");
      onClose();
    } catch (err) {
      console.error("Error adding contact:", err);
      setError("❌ Failed to add contact. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Add New Contact</h2>

        <form onSubmit={handleAddContact} className="space-y-4">
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-400"
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
