// apis/agendaAPI.js
import api from './authApi';
import { DateTime } from 'luxon';
export const agendaAPI = {
  getDayAgenda: (barbershopId, date, employeeId = null) => {
    const params = { date, barbershopId };
    if (employeeId) params.employeeId = employeeId;
    
    return api.get('/agenda', { params });
  }, getWeekAgenda: async (barbershopId, weekStartISO, employeeId = null) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = DateTime.fromISO(weekStartISO).plus({ days: i }).toISODate();
      days.push(d);
    }
    const promises = days.map(date =>
      agendaAPI.getDayAgenda(barbershopId, date, employeeId)
    );
    const responses = await Promise.all(promises);

    return responses.map(r => r.data); // [{ date, zone, entries }, ...]
  }
};