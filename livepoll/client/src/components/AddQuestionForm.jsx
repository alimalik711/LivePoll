import React, { useState } from 'react';
import api from '../api/axios';

const AddQuestionForm = ({ sessionId, onQuestionAdded }) => {
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState(['', '']); // Start with 2 empty options
    const [loading, setLoading] = useState(false);

    // Update a specific option in the array
    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    // Add a new empty string to the array to create a new input field
    const addOptionField = () => setOptions([...options, '']);

    // Remove a specific option field (guarantees at least 2 options remain)
    const removeOptionField = (indexToRemove) => {
        if (options.length <= 2) return;
        setOptions(options.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. We filter out any empty options before sending to the backend
            const validOptions = options.filter(opt => opt.trim() !== '');

            if (validOptions.length < 2) {
                alert("Please provide at least 2 non-empty options.");
                setLoading(false);
                return;
            }

            await api.post(`/sessions/${sessionId}/questions`, {
                questionText: questionText,
                options: validOptions
            });

            // 2. Reset the form
            setQuestionText('');
            setOptions(['', '']);
            
            // 3. IMPORTANT: Tell the parent (PresenterControl) to refresh the list
            onQuestionAdded(); 
            
        } catch (err) {
            console.error(err);
            alert("Failed to add question. Make sure your server is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="add-question-form">
            <div className="form-group">
                <label>Question Text</label>
                <input 
                    type="text" 
                    placeholder="e.g., Which framework is your favorite?"
                    value={questionText} 
                    onChange={(e) => setQuestionText(e.target.value)}
                    required
                />
            </div>

            <div className="form-group">
                <label>Options</label>
                {options.map((opt, index) => (
                    <div key={index} className="option-input-wrapper">
                        <input 
                            type="text" 
                            placeholder={`Option ${index + 1}`}
                            value={opt}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            required
                        />
                        {options.length > 2 && (
                            <button 
                                type="button" 
                                className="btn-remove-option"
                                onClick={() => removeOptionField(index)}
                                title="Remove Option"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <button type="button" className="btn-secondary" onClick={addOptionField}>
                + Add Another Option
            </button>
            
            <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Question'}
            </button>
        </form>
    );
};

export default AddQuestionForm;