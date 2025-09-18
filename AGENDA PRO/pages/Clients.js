import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Business } from "@/entities/Business";
import { Client } from "@/entities/Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users, Phone, Mail, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import ClientForm from "../components/clients/ClientForm";
import ClientCard from "../Components/clients/ClientCard.js";

export default function Clients() {
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      if (userData.role === 'admin') {
        const [allClients, allBusinesses] = await Promise.all([
          Client.list("-created_date"),
          Business.list()
        ]);
        setClients(allClients);
        setBusinesses(allBusinesses);
      } else {
        const userBusinesses = await Business.filter({created_by: userData.email});
        if (userBusinesses.length > 0) {
          const businessId = userBusinesses[0].id;
          const userClients = await Client.filter({business_id: businessId}, "-created_date");
          setClients(userClients);
          setBusinesses(userBusinesses);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (clientData) => {
    try {
      if (editingClient) {
        await Client.update(editingClient.id, clientData);
      } else {
        await Client.create(clientData);
      }
      setShowForm(false);
      setEditingClient(null);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48"></div>
            <div className="grid gap-4">
              {Array(6).fill(0).map((_, i) => (
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
            <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
            <p className="text-slate-600 mt-1">Gerencie seus clientes cadastrados</p>
          </motion.div>
          
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-slate-700 hover:bg-slate-800 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <ClientForm
              client={editingClient}
              businesses={businesses}
              currentUser={user}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingClient(null);
              }}
            />
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {clients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                businesses={businesses}
                onEdit={handleEdit}
              />
            ))}
          </AnimatePresence>
          
          {clients.length === 0 && (
            <div className="col-span-full">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-slate-200">
                <CardContent className="py-12 text-center">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Nenhum cliente cadastrado
                  </h3>
                  <p className="text-slate-500">
                    Cadastre seu primeiro cliente clicando no botão "Novo Cliente"
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}