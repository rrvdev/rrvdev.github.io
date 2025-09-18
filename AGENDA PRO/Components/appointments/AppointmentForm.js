import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, X, Save } from "lucide-react";

export default function AppointmentForm({ 
  appointment, 
  businesses, 
  clients, 
  services, 
  currentUser,
  onSubmit, 
  onCancel 
}) {
  const [formData, setFormData] = useState(appointment || {
    client_id: "",
    business_id: currentUser?.role === 'user' ? businesses[0]?.id || "" : "",
    service_id: "",
    appointment_date: "",
    notes: "",
    client_name: "",
    client_phone: "",
    client_email: "",
    status: "agendado"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calcular preço total baseado no serviço
    const selectedService = services.find(s => s.id === formData.service_id);
    const finalData = {
      ...formData,
      total_price: selectedService?.price || 0
    };
    
    onSubmit(finalData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="mb-8 bg-white/90 backdrop-blur-sm shadow-xl border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-600" />
              {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentUser?.role === 'admin' && (
                <div className="space-y-2">
                  <Label htmlFor="business">Estabelecimento</Label>
                  <Select 
                    value={formData.business_id} 
                    onValueChange={(value) => handleInputChange('business_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estabelecimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {businesses.map((business) => (
                        <SelectItem key={business.id} value={business.id}>
                          {business.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="client">Cliente Cadastrado</Label>
                <Select 
                  value={formData.client_id} 
                  onValueChange={(value) => handleInputChange('client_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.filter(c => !formData.business_id || c.business_id === formData.business_id).map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_name">Nome do Cliente</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => handleInputChange('client_name', e.target.value)}
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_phone">Telefone</Label>
                <Input
                  id="client_phone"
                  value={formData.client_phone}
                  onChange={(e) => handleInputChange('client_phone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_email">Email (opcional)</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => handleInputChange('client_email', e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Serviço</Label>
                <Select 
                  value={formData.service_id} 
                  onValueChange={(value) => handleInputChange('service_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.filter(s => !formData.business_id || s.business_id === formData.business_id).map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - R$ {service.price?.toFixed(2)} ({service.duration_minutes}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment_date">Data e Hora</Label>
                <Input
                  id="appointment_date"
                  type="datetime-local"
                  value={formData.appointment_date}
                  onChange={(e) => handleInputChange('appointment_date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="nao_compareceu">Não Compareceu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Observações sobre o agendamento..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-slate-700 hover:bg-slate-800">
                <Save className="w-4 h-4 mr-2" />
                {appointment ? 'Atualizar' : 'Criar'} Agendamento
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}