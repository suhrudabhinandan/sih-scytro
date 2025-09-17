import React, { useState } from 'react';

const SupportForm = ({ setCurrentScreen, slideIn }) => {
	const [name, setName] = useState('');
	const [contact, setContact] = useState('');
	const [message, setMessage] = useState('');
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = (e) => {
		e.preventDefault();
		setSubmitted(true);
		setTimeout(() => setCurrentScreen('intro'), 1500);
	};

	if (submitted) {
		return (
			<div className={`min-h-screen bg-gray-50 flex items-center justify-center ${slideIn}`}>
				<div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
					<p className="font-bold text-gray-900">Thanks! We will reach out soon.</p>
				</div>
			</div>
		);
	}

	return (
		<div className={`min-h-screen bg-gray-50 ${slideIn}`}>
			<div className="max-w-md mx-auto p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-4">Get Support / Help</h2>
				<form onSubmit={handleSubmit} className="space-y-4">
					<input className="w-full p-4 border border-gray-200 rounded-2xl" placeholder="Your name" value={name} onChange={(e)=>setName(e.target.value)} required />
					<input className="w-full p-4 border border-gray-200 rounded-2xl" placeholder="Contact (email or phone)" value={contact} onChange={(e)=>setContact(e.target.value)} required />
					<textarea className="w-full p-4 border border-gray-200 rounded-2xl" rows={5} placeholder="Describe your issue" value={message} onChange={(e)=>setMessage(e.target.value)} required />
					<div className="flex gap-3">
						<button type="submit" className="flex-1 bg-yellow-500 text-white font-bold py-3 rounded-2xl">Submit</button>
						<button type="button" className="flex-1 bg-white border border-gray-200 font-bold py-3 rounded-2xl" onClick={()=>setCurrentScreen('intro')}>Cancel</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default SupportForm;
