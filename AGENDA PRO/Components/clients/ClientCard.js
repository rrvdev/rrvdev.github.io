import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Edit2,
  Building2
} from "lucide-react";

export default function ClientCard({ client, businesses, onEdit }) {
  const business = businesses.find(b => b.id === client.business_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-slate-200 hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {client.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">{client.name}</h3>
                {business && (
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Building2 className="w-3 h-3" />
                    {business.name}
                  </div>
                )}
              </div>
            </div>
            
            <Button variant="ghost" size="icon" onClick={() => onEdit(client)}>
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4" />
              <span>{client.phone}</span>
            </div>

            {client.email && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4" />
                <span>{client.email}</span>
              </div>
            )}

            {client.birth_date && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>Nascimento: {format(new Date(client.birth_date), "d 'de' MMMM", { locale: ptBR })}</span>
              </div>
            )}

            {client.address && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{client.address}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
            <div className="text-sm text-slate-500">
              Total de agendamentos: {client.total_appointments || 0}
            </div>
            
            {client.last_appointment && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Último: {format(new Date(client.last_appointment), "dd/MM", { locale: ptBR })}
              </Badge>
            )}
          </div>

          {client.notes && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">{client.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}