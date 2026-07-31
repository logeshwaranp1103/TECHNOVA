import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, Bell, Calendar as CalendarIcon, ChevronRight, User, Settings, 
  LogOut, Armchair, Users, UserCheck, Layers, CalendarCheck 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    globalSearchQuery, 
    setGlobalSearchQuery, 
    unreadNotificationCount, 
    openDrawer, 
    adminProfile,
    students,
    staff,
    seats,
    floors,
    reservations,
    setSelectedSeatId,
    setSelectedStudentId,
    setSelectedStaffId,
    setSelectedFloorId,
    setSelectedReservationId
  } = useAppStore();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Derive Breadcrumb text
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return { section: 'Overview', page: 'Administrator Dashboard' };
    if (path.startsWith('/students')) return { section: 'Users', page: 'Student Management' };
    if (path.startsWith('/staff')) return { section: 'Users', page: 'Library Staff Management' };
    if (path.startsWith('/reservations')) return { section: 'Library administration', page: 'Reservation Management' };
    if (path.startsWith('/floors')) return { section: 'Library administration', page: 'Floor Management' };
    if (path.startsWith('/seats')) return { section: 'Library administration', page: 'Seat Management' };
    if (path.startsWith('/waiting-list')) return { section: 'System', page: 'Waiting List Queue' };
    if (path.startsWith('/analytics')) return { section: 'System', page: 'Analytics Dashboard' };
    if (path.startsWith('/reports')) return { section: 'System', page: 'Reports Center' };
    if (path.startsWith('/notifications')) return { section: 'System', page: 'Notification Center' };
    if (path.startsWith('/audit-logs')) return { section: 'System', page: 'Audit Logs' };
    if (path.startsWith('/settings')) return { section: 'System', page: 'System Settings' };
    if (path.startsWith('/profile')) return { section: 'System', page: 'Administrator Profile' };
    return { section: 'Library administration', page: 'Overview' };
  };

  const breadcrumb = getBreadcrumbs();
  const currentDateFormatted = 'Thursday, 31 Jul 2026';

  // Compute Search Results across all modules
  const q = globalSearchQuery.trim().toLowerCase();
  const hasQuery = q.length > 0;

  const matchedStudents = hasQuery ? students.filter(s => 
    s.name.toLowerCase().includes(q) || s.registerNo.toLowerCase().includes(q) || s.department.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  const matchedStaff = hasQuery ? staff.filter(s => 
    s.name.toLowerCase().includes(q) || s.employeeId.toLowerCase().includes(q) || s.role.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  const matchedSeats = hasQuery ? seats.filter(s => 
    s.code.toLowerCase().includes(q) || s.floorName.toLowerCase().includes(q) || s.zoneName.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  const matchedFloors = hasQuery ? floors.filter(f => 
    f.name.toLowerCase().includes(q) || f.buildingWing.toLowerCase().includes(q)
  ).slice(0, 2) : [];

  const matchedReservations = hasQuery ? reservations.filter(r => 
    r.id.toLowerCase().includes(q) || r.studentName.toLowerCase().includes(q) || r.seatCode.toLowerCase().includes(q)
  ).slice(0, 3) : [];

  const totalMatchCount = matchedStudents.length + matchedStaff.length + matchedSeats.length + matchedFloors.length + matchedReservations.length;

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
      {/* Left: Breadcrumb */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium truncate">
          <span className="truncate">{breadcrumb.section}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-600 font-semibold truncate">{breadcrumb.page}</span>
        </div>
      </div>

      {/* Right: Search, Date, Notifications, Quick Actions, Profile */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Global Search Input with Dropdown Overlay */}
        <div className="relative hidden md:flex items-center w-64 lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={globalSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => {
              setGlobalSearchQuery(e.target.value);
              setIsSearchFocused(true);
            }}
            placeholder="Search operations, seats, students..."
            className="w-full pl-10 pr-9 py-2 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs text-navy placeholder:text-slate-400 focus:outline-none focus:border-brandBlue focus:bg-white focus:ring-2 focus:ring-brandBlue/15 transition-all"
          />
          <kbd className="absolute right-3 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
            ⌘K
          </kbd>

          {/* Interactive Global Search Overlay */}
          {isSearchFocused && hasQuery && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsSearchFocused(false)} />
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-40 max-h-96 overflow-y-auto p-3 space-y-3 text-xs divide-y divide-slate-100">
                {totalMatchCount === 0 ? (
                  <div className="p-4 text-center text-slate-500 font-medium">
                    No system entities found matching "{globalSearchQuery}"
                  </div>
                ) : (
                  <>
                    {/* Seats Match */}
                    {matchedSeats.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                          <Armchair className="w-3.5 h-3.5 text-brandBlue" />
                          <span>Seats ({matchedSeats.length})</span>
                        </div>
                        {matchedSeats.map(seat => (
                          <div
                            key={seat.id}
                            onClick={() => {
                              setSelectedSeatId(seat.id);
                              navigate('/seats');
                              setIsSearchFocused(false);
                            }}
                            className="p-2.5 rounded-xl hover:bg-blue-50/80 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <span className="font-mono font-bold text-brandBlue text-xs block">{seat.code}</span>
                              <span className="text-[11px] text-slate-500">{seat.floorName} • {seat.zoneName}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">{seat.status}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Students Match */}
                    {matchedStudents.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Students ({matchedStudents.length})</span>
                        </div>
                        {matchedStudents.map(student => (
                          <div
                            key={student.id}
                            onClick={() => {
                              setSelectedStudentId(student.id);
                              navigate('/students');
                              setIsSearchFocused(false);
                            }}
                            className="p-2.5 rounded-xl hover:bg-emerald-50/80 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <span className="font-bold text-navy text-xs block">{student.name}</span>
                              <span className="text-[11px] text-slate-500">{student.registerNo} • {student.department}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-700 capitalize">{student.status}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Staff Match */}
                    {matchedStaff.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                          <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span>Library Staff ({matchedStaff.length})</span>
                        </div>
                        {matchedStaff.map(stf => (
                          <div
                            key={stf.id}
                            onClick={() => {
                              setSelectedStaffId(stf.id);
                              navigate('/staff');
                              setIsSearchFocused(false);
                            }}
                            className="p-2.5 rounded-xl hover:bg-purple-50/80 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <span className="font-bold text-navy text-xs block">{stf.name}</span>
                              <span className="text-[11px] text-slate-500">{stf.role} • {stf.assignedFloor}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reservations Match */}
                    {matchedReservations.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                          <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>Reservations ({matchedReservations.length})</span>
                        </div>
                        {matchedReservations.map(res => (
                          <div
                            key={res.id}
                            onClick={() => {
                              setSelectedReservationId(res.id);
                              navigate('/reservations');
                              setIsSearchFocused(false);
                            }}
                            className="p-2.5 rounded-xl hover:bg-amber-50/80 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <span className="font-mono font-bold text-navy text-xs block">{res.id} ({res.seatCode})</span>
                              <span className="text-[11px] text-slate-500">{res.studentName} • {res.floorName}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-amber-700 capitalize">{res.status}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Floors Match */}
                    {matchedFloors.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                          <Layers className="w-3.5 h-3.5 text-tealAccent-600" />
                          <span>Floors ({matchedFloors.length})</span>
                        </div>
                        {matchedFloors.map(floor => (
                          <div
                            key={floor.id}
                            onClick={() => {
                              setSelectedFloorId(floor.id);
                              navigate('/floors');
                              setIsSearchFocused(false);
                            }}
                            className="p-2.5 rounded-xl hover:bg-teal-50/80 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <span className="font-bold text-navy text-xs block">{floor.name}</span>
                              <span className="text-[11px] text-slate-500">{floor.buildingWing} • Supervisor: {floor.supervisorName}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Current Date */}
        <div className="hidden xl:flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{currentDateFormatted}</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={() => openDrawer('notifications')}
          className="relative p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200/80 bg-white cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-errorRed text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse border-2 border-white">
              {unreadNotificationCount}
            </span>
          )}
        </button>

        {/* Admin Avatar Profile Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-1 cursor-pointer focus:outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-brandBlue/10 border-2 border-brandBlue/20 flex items-center justify-center shadow-2xs hover:border-brandBlue transition-all">
              <User className="w-4.5 h-4.5 text-brandBlue" />
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-dropdown border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
              <div 
                onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                className="px-4 py-2.5 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                title="View Profile"
              >
                <div className="text-xs font-bold text-navy truncate">{adminProfile.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{adminProfile.email}</div>
              </div>
              <button
                onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-400" />
                Admin Profile
              </button>
              <button
                onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                System Settings
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => alert('Logged out successfully')}
                className="w-full text-left px-4 py-2.5 text-xs text-errorRed hover:bg-red-50 flex items-center gap-2.5 font-semibold cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
