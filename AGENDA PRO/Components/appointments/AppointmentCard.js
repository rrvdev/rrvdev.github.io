import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Edit2, 
  CheckCircle, 
  XCircle,
  PlayCircle,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusColors = {
  agendado: "bg-blue-50 text-blue-700 border-blue-200",
  confirmado: "bg-emerald-50 text-emerald-700 border-emerald-200",
  em_andamento: "bg-amber-50 text-amber-700 border-amber-200",
  concluido: "bg-green-50 text-green-700 border-green-200",
  cancelado: "bg-red-50 text-red-700 border-red-200",
  nao_compareceu: "bg-slate-50 text-slate-700 border-slate-200"
};

const statusLabels = {
  agendado: "Agendado",
  confirmado: "Confirmado", 
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  nao_compareceu: "Não Compareceu"
};

const statusIcons = {
  agendado: Calendar,
  confirmado: CheckCircle,
  em_andamento: PlayCircle,
  concluido: CheckCircle,
  cancelado: XCircle,
  nao_compareceu: AlertCircle
};

export default function AppointmentCard({ 
  appointment, 
  businesses, 
  clients, 
  services, 
  onEdit, 
  onStatusChange 
}) {
  const business = businesses.find(b => b.id === appointment.business_id);
  const client = clients.find(c => c.id === appointment.client_id);
  const service = services.find(s => s.id === appointment.service_id);
  const StatusIcon = statusIcons[appointment.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-slate-200 hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {appointment.client_name || client?.name || 'Cliente'}
                </h3>
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Phone className="w-3 h-3" />
                  {appointment.client_phone || client?.phone}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={statusColors[appointment.status]}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusLabels[appointment.status]}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onEdit(appointment)}>
                    Editar Agendamento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(appointment.id, "confirmado")}>
                    Marcar como Confirmado
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(appointment.id, "em_andamento")}>
                    Iniciar Atendimento
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(appointment.id, "concluido")}>
                    Finalizar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(appointment.id, "cancelado")}>
                    Cancelar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(appointment.appointment_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(appointment.appointment_date), "HH:mm")}</span>
            </div>

            {business && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4" />
                <span>{business.name}</span>
              </div>
            )}
          </div>

          {service && (
            <div className="bg-slate-50 rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-900">{service.name}</p>
                  <p className="text-sm text-slate-500">{service.duration_minutes} minutos</p>
                </div>
                <p className="font-semibold text-slate-900">
                  R$ {service.price?.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {appointment.notes && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-slate-600">{appointment.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}