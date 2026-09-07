import React, { useEffect, useState } from 'react';
import { 
  Database, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RotateCcw
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabaseClient';
import { useAdminSession } from './AdminSessionContext';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  total_copies: number;
  available_copies: number;
}

interface Loan {
  id: string;
  student_id: string;
  book_id: string;
  due_date: string;
  is_returned: boolean;
}

export const AdminLibrary: React.FC = () => {
  const { role } = useAdminSession();
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'catalog' | 'loans'>('catalog');

  // Add Book Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [totalCopies, setTotalCopies] = useState(5);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase backend not configured');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [bookRes, loanRes, studRes] = await Promise.all([
        supabase.from('library_books').select('*').order('title'),
        supabase.from('library_loans').select('*').order('due_date'),
        supabase.from('profiles').select('id, full_name, email').eq('role', 'student'),
      ]);

      if (bookRes.error) throw bookRes.error;
      setBooks(bookRes.data ?? []);
      setLoans(loanRes.data ?? []);
      setStudents(studRes.data ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load library catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleReturnLoan = async (loanId: string, bookId: string) => {
    if (!supabase) return;
    try {
      const { error: loanErr } = await supabase
        .from('library_loans')
        .update({ is_returned: true })
        .eq('id', loanId);
      if (loanErr) throw loanErr;

      // Increment available_copies
      const book = books.find((b) => b.id === bookId);
      if (book) {
        await supabase
          .from('library_books')
          .update({ available_copies: book.available_copies + 1 })
          .eq('id', bookId);
      }

      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to return book');
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setFeedback(null);
    try {
      const { error: insErr } = await supabase.from('library_books').insert({
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        category,
        total_copies: Number(totalCopies),
        available_copies: Number(totalCopies),
      });
      if (insErr) throw insErr;

      setFeedback('Book added to catalog successfully!');
      setTimeout(() => setModalOpen(false), 1200);
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? 'Failed to add book');
    } finally {
      setSaving(false);
    }
  };

  const studMap = Object.fromEntries(students.map((s) => [s.id, s.full_name]));
  const bookMap = Object.fromEntries(books.map((b) => [b.id, b.title]));

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()) ||
      b.isbn.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Database className="w-4 h-4" />
            <span>Learning Resources</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Central Library</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Book catalog, loan ledger, return processing, and real-time inventory counts.
          </p>
        </div>
        {(role === 'admin' || role === 'staff' || role === 'vice_principal') && (
          <button
            onClick={() => {
              setTitle('');
              setAuthor('');
              setIsbn('');
              setTotalCopies(5);
              setFeedback(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-glow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Book</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'catalog'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Book Catalog ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'loans'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Active Loans ({loans.filter((l) => !l.is_returned).length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search books by title, author, or ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading library database...</p>
        </div>
      ) : activeTab === 'catalog' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBooks.map((b) => (
            <div
              key={b.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                    {b.category}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">{b.title}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">by {b.author}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    b.available_copies > 0
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {b.available_copies > 0 ? 'Available' : 'Out of Stock'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>ISBN: {b.isbn}</span>
                <span className="text-white font-bold">
                  {b.available_copies} / {b.total_copies} Copies
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Loans Tab */
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-semibold">Book Title</th>
                  <th className="p-3.5 font-semibold">Borrower</th>
                  <th className="p-3.5 font-semibold">Due Date</th>
                  <th className="p-3.5 font-semibold">Loan Status</th>
                  <th className="p-3.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {loans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-sans font-semibold text-white">
                      {bookMap[l.book_id] ?? 'Book'}
                    </td>
                    <td className="p-3.5 font-sans text-slate-300">
                      {studMap[l.student_id] ?? 'Student'}
                    </td>
                    <td className="p-3.5 text-slate-300">{l.due_date}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.is_returned
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        }`}
                      >
                        {l.is_returned ? 'Returned' : 'Issued'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-sans">
                      {!l.is_returned && (role === 'admin' || role === 'staff') && (
                        <button
                          onClick={() => handleReturnLoan(l.id, l.book_id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Return</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Add Book to Catalog</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{feedback}</span>
              </div>
            )}

            <form onSubmit={handleAddBook} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Book Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Design Patterns in C++"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Author</label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Erich Gamma et al."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Computer Science, Mathematics..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">ISBN</label>
                  <input
                    type="text"
                    required
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="978-0201633610"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Total Copies</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={totalCopies}
                    onChange={(e) => setTotalCopies(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
                >
                  {saving ? 'Adding…' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
