import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookingService } from '../services/bookingService';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { Clock, MapPin, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const res = await bookingService.getMyBookings(user.id);
        const past = res.filter(r => ['completed', 'cancelled', 'no_show'].includes(r.status));
        setHistory(past);
      } catch (error) {
        toast.error('Failed to fetch history');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge variant="outline">Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
      case 'no_show': return <Badge variant="warning">No-show</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-navy">Booking History</h1>
        <p className="text-muted-foreground mt-1">Review your past library sessions.</p>
      </div>

      {loading ? (
        <div>Loading history...</div>
      ) : history.length === 0 ? (
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No booking history found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map(item => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-navy">{item.seatNumber}</h3>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><MapPin size={14}/> {item.floorId}</div>
                    <div className="flex items-center gap-2"><Calendar size={14}/> {format(new Date(item.bookingDate), 'PPP')}</div>
                    <div className="flex items-center gap-2"><Clock size={14}/> {item.startTime} - {item.endTime}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
