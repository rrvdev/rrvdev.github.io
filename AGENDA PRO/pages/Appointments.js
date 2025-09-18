
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Business } from "@/entities/Business";
import { Appointment } from "@/entities/Appointment";
import { Client } from "@/entities/Client";
import { Service } from "@/entities/Service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, Clock, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import AppointmentForm from "../Components/appointments/AppointmentForm.js";
import AppointmentCard from "../Components/appointments/AppointmentCard.js/index.js";
import AppointmentFilters from "../Components/appointments/AppointmentFilters.js/index.js";

export default function Appointments() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    date: "all",
    business: "all"
  });

  const loadData = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      if (userData.role === 'admin') {
        const [allAppointments, allBusinesses, allClients, allServices] = await Promise.all([
          Appointment.list("-appointment_date"),
          Business.list(),
          Client.list(),
          Service.list()
        ]);

        setAppointments(allAppointments);
        setBusinesses(allBusinesses);
        setClients(allClients);
        setServices(allServices);
      } else {
        const userBusinesses = await Business.filter({created_by: userData.email});
        
        if (userBusinesses.length === 0) {
          setAppointments([]);
          setBusinesses([]);
          setClients([]);
          setServices([]);
          return;
        }

        const businessId = userBusinesses[0].id;
        const [userAppointments, userClients, userServices] = await Promise.all([
          Appointment.filter({business_id: businessId}, "-appointment_date"),
          Client.filter({business_id: businessId}),
          Service.filter({business_id: businessId})
        ]);

        setAppointments(userAppointments);
        setBusinesses(userBusinesses);
        setClients(userClients);
        setServices(userServices);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (appointmentData) => {
    try {
      if (editingAppointment) {
        await Appointment.update(editingAppointment.id, appointmentData);
      } else {
        await Appointment.create(appointmentData);
      }
      setShowForm(false);
      setEditingAppointment(null);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
    }
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await Appointment.update(appointmentId, { status: newStatus });
      loadData();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filters.status !== "all" && appointment.status !== filters.status) {
      return false;
    }
    if (filters.business !== "all" && appointment.business_id !== filters.business) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="grid gap-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold text-slate-900">Agendamentos</h1>
            <p className="text-slate-600 mt-1">Gerencie todos os seus agendamentos</p>
          </motion.div>
          
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-slate-700 hover:bg-slate-800 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <AppointmentForm
              appointment={editingAppointment}
              businesses={businesses}
              clients={clients}
              services={services}
              currentUser={user}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingAppointment(null);
              }}
            />
          )}
        </AnimatePresence>

        <AppointmentFilters 
          filters={filters}
          setFilters={setFilters}
          businesses={businesses}
        />

        <div className="grid gap-4">
          <AnimatePresence>
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                businesses={businesses}
                clients={clients}
                services={services}
                onEdit={handleEdit}
                onStatusChange={handleStatusChange}
              />
            ))}
          </AnimatePresence>
          
          {filteredAppointments.length === 0 && (
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-slate-200">
              <CardContent className="py-12 text-center">
                <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Nenhum agendamento encontrado
                </h3>
                <p className="text-slate-500">
                  Crie seu primeiro agendamento clicando no botão "Novo Agendamento"
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
