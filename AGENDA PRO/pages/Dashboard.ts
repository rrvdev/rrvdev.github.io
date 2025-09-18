
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Business } from "@/entities/Business";
import { Appointment } from "@/entities/Appointment";
import { Client } from "@/entities/Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Building2, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, isToday, isTomorrow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

import StatsCard from "../Components/dashboard/StatsCard.js";
import AppointmentsList from "../components/dashboard/AppointmentsList";
import RecentClients from "../components/dashboard/RecentClients";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    totalClients: 0,
    monthlyRevenue: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const userData = await User.me();
        setUser(userData);

        if (userData.role === 'admin') {
          await loadAdminData();
        } else {
          await loadUserData(userData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
      setLoading(false);
    };

    const loadAdminData = async () => {
      const [allAppointments, allClients] = await Promise.all([
        Appointment.list("-appointment_date", 50),
        Client.list("-created_date", 20)
      ]);

      const today = new Date();
      const todayAppointments = allAppointments.filter(apt => 
        isToday(new Date(apt.appointment_date))
      );

      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      const monthlyRevenue = allAppointments
        .filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate >= monthStart && aptDate <= monthEnd && apt.status === 'concluido';
        })
        .reduce((sum, apt) => sum + (apt.total_price || 0), 0);

      setStats({
        totalAppointments: allAppointments.length,
        todayAppointments: todayAppointments.length,
        totalClients: allClients.length,
        monthlyRevenue
      });

      setAppointments(allAppointments.slice(0, 10));
      setClients(allClients.slice(0, 5));
    };

    const loadUserData = async (userData) => {
      const userBusinesses = await Business.filter({created_by: userData.email});
      const businessIds = userBusinesses.map(b => b.id);

      if (businessIds.length === 0) {
        setStats({
          totalAppointments: 0,
          todayAppointments: 0,
          totalClients: 0,
          monthlyRevenue: 0
        });
        return;
      }

      const [userAppointments, userClients] = await Promise.all([
        Appointment.filter({business_id: businessIds[0]}, "-appointment_date", 50),
        Client.filter({business_id: businessIds[0]}, "-created_date", 20)
      ]);

      const today = new Date();
      const todayAppointments = userAppointments.filter(apt => 
        isToday(new Date(apt.appointment_date))
      );

      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      const monthlyRevenue = userAppointments
        .filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate >= monthStart && aptDate <= monthEnd && apt.status === 'concluido';
        })
        .reduce((sum, apt) => sum + (apt.total_price || 0), 0);

      setStats({
        totalAppointments: userAppointments.length,
        todayAppointments: todayAppointments.length,
        totalClients: userClients.length,
        monthlyRevenue
      });

      setAppointments(userAppointments.slice(0, 10));
      setClients(userClients.slice(0, 5));
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 rounded-xl"></div>
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Olá, {user?.full_name}! 👋
          </h1>
          <p className="text-slate-600">
            {user?.role === 'admin' 
              ? 'Visão geral de todos os estabelecimentos' 
              : 'Acompanhe o desempenho do seu negócio'
            }
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Agendamentos"
            value={stats.totalAppointments}
            icon={Calendar}
            color="blue"
          />
          <StatsCard
            title="Hoje"
            value={stats.todayAppointments}
            icon={Clock}
            color="emerald"
          />
          <StatsCard
            title="Clientes"
            value={stats.totalClients}
            icon={Users}
            color="purple"
          />
          <StatsCard
            title="Receita Mensal"
            value={`R$ ${stats.monthlyRevenue.toFixed(2)}`}
            icon={TrendingUp}
            color="amber"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AppointmentsList 
              appointments={appointments}
              title="Próximos Agendamentos"
            />
          </div>

          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Status do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Agendamentos Online</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Notificações</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Ativo
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <RecentClients clients={clients} />
          </div>
        </div>
      </div>
    </div>
  );
}
