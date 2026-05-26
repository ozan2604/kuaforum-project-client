import sys

file_path = r'c:\Users\Ozan\Desktop\Kuaforum\kuaforum-project-client\src\pages\employee\EmployeeAppointmentsPage.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State changes
content = content.replace(
    'const [managementOpen, setManagementOpen] = useState(false);',
    'const [activeMainTab, setActiveMainTab] = useState<\'calendar\' | \'management\'>(\'calendar\');\n    const [managementEnabled, setManagementEnabled] = useState(false);'
)

# 2. Add handleMainTabChange
content = content.replace(
    'const isAutoProcessEnabled = false; // Add for compatibility with salon UI',
    'const isAutoProcessEnabled = false; // Add for compatibility with salon UI\n\n    const handleMainTabChange = (tab: \'calendar\' | \'management\') => {\n        setActiveMainTab(tab);\n        if (tab === \'management\') setManagementEnabled(true);\n    };'
)

# 3. Fix loadData dependency
content = content.replace(
    'useEffect(() => { loadData(); }, [page, pageSize, statusFilter, searchTerm, filterDate, filterServiceId]);',
    'useEffect(() => { if (managementEnabled) loadData(); }, [managementEnabled, page, pageSize, statusFilter, searchTerm, filterDate, filterServiceId]);'
)

# 4. Truncate -> break-words
content = content.replace(
    'flex-1 min-w-0 truncate',
    'flex-1 min-w-0 break-words whitespace-normal'
)

# 5. UI Structure
old_ui = """                {/* ── Haftalık Takvim ── */}
                <WeeklyCalendarCard
                    appointments={weeklyAppointments}
                    loading={weeklyLoading}
                    daysAhead={bookingDaysAhead}
                />

                {/* ══════════════════════════════════════════
                CARD 2 — Randevu Yönetimi
            ══════════════════════════════════════════ */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
                    <div
                        onClick={() => setManagementOpen(v => !v)}
                        className="w-full p-5 sm:p-6 flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors relative"
                    >
                        <div className="flex items-center gap-3 pr-10">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Filter className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Randevu Yönetimi</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Filtrele, ara ve randevu durumlarını güncelle</p>
                            </div>
                        </div>

                        {!managementOpen && !loading && totalCount > 0 && (
                            <div className="hidden sm:flex items-center gap-2 mr-10">
                                <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full border border-indigo-100">
                                    {totalCount} kayıt
                                </span>
                            </div>
                        )}

                        <div className="absolute right-5 sm:right-6 p-1 bg-gray-50 rounded-full text-gray-400">
                            {managementOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                    </div>

                    {managementOpen && (
                        <div className="border-t border-gray-50 animate-in fade-in slide-in-from-top-4 duration-300">"""

new_ui = """            {/* ── Main Tab Bar ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex">
                    <button
                        onClick={() => handleMainTabChange('calendar')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors rounded-tl-2xl ${
                            activeMainTab === 'calendar'
                                ? 'border-primary-600 text-primary-700 bg-primary-50/40'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Randevu Takvimi
                    </button>
                    <button
                        onClick={() => handleMainTabChange('management')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                            activeMainTab === 'management'
                                ? 'border-primary-600 text-primary-700 bg-primary-50/40'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Filter className="w-4 h-4" />
                        Randevu Yönetimi
                        {managementEnabled && !loading && totalCount > 0 && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full">
                                {totalCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ── Calendar Tab ── */}
            {activeMainTab === 'calendar' && (
                <div className="space-y-4">
                    <WeeklyCalendarCard
                        appointments={weeklyAppointments}
                        loading={weeklyLoading}
                        daysAhead={bookingDaysAhead}
                        defaultOpen
                    />
                </div>
            )}

            {/* ── Management Tab ── */}
            {activeMainTab === 'management' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200">
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300">"""

content = content.replace(old_ui, new_ui)

# Fix the closing tags:
old_end = """                                })()}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>

            {/* Confirmation Modal */}"""

new_end = """                                })()}
                            </div>
                        </>
                    )}
                    </div>
                </div>
            )}
        </div>

            {/* Confirmation Modal */}"""

content = content.replace(old_end, new_end)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('SUCCESS')
