import { useState } from 'react';
import './ReportMenu.css';
import { useAuth } from '../context/AuthContext';

export default function ReportMenu({targetId, targetModel, setSelfState}){
    const {accessToken} = useAuth();
    const [reason, setReason] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const reasons = [
        { value: "spam", label: "Spam" },
        { value: "abuse", label: "Abusive Content" },
        { value: "harassment", label: "Harassment" },
        { value: "other", label: "Other" },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) return alert("Please select a reason for reporting.");

        setSubmitting(true);

        try {
            const response = await fetch("/api/report", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    target: targetId,
                    targetModel,
                    reason,
                    description: description.trim() || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to submit report");
            }

            alert("Report submitted successfully!");
            setSelfState(false);
        } catch (err) {
            console.error("Report submission error:", err);
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className='report-menu-container'>
            {/* Background overlay */}
            <div className='report-menu-background' onClick={() => setSelfState(false)}></div>

            {/* Actual report menu */}
            <div className='report-menu-body'>
                <h3>Report {targetModel}</h3>

                <form onSubmit={handleSubmit} className="report-form">
                    <label>
                        Reason:
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        >
                            <option value="">Select a reason</option>
                            {reasons.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </label>

                    <label className='description'>
                        Description (optional):
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add more details..."
                        ></textarea>
                    </label>

                    <div className="report-menu-actions">
                        <button type="button" onClick={() => setSelfState(false)} disabled={submitting}>
                            Cancel
                        </button>
                        <button type="submit" disabled={submitting}>
                            {submitting ? "Submitting..." : "Submit Report"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}