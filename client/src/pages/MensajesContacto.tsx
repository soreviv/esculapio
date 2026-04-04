import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ContactMessage } from "@shared/schema";
import {
  Inbox,
  Mail,
  MailOpen,
  Reply,
  Phone,
  Clock,
  User,
  CheckCheck,
} from "lucide-react";

export default function MensajesContacto() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const { data: messages = [] as ContactMessage[], isLoading } = useQuery<ContactMessage[]>({
    queryKey: ["/api/contact-messages"],
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/contact-messages/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/contact-messages"] }),
  });

  const handleSelect = (msg: ContactMessage) => {
    setSelected(msg);
    setReplyText("");
    if (!msg.read) markReadMutation.mutate(msg.id);
  };

  const handleReply = async () => {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      await apiRequest("POST", `/api/contact-messages/${selected.id}/reply`, { replyBody: replyText.trim() });
      toast({ title: "Respuesta enviada correctamente" });
      setReplyText("");
      void queryClient.invalidateQueries({ queryKey: ["/api/contact-messages"] });
    } catch {
      toast({ title: "Error al enviar respuesta", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  const formatDate = (d: Date | string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Inbox className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Mensajes del Portal</h1>
          <p className="text-muted-foreground">
            Mensajes recibidos a través del formulario de contacto
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="ml-auto">
            {unreadCount} sin leer
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        {/* Message list */}
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {messages.length} mensaje{messages.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
                <Mail className="h-8 w-8 opacity-40" />
                <p className="text-sm">Sin mensajes</p>
              </div>
            ) : (
              <ul className="divide-y">
                {[...messages]
                  .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
                  .map((msg) => (
                    <li
                      key={msg.id}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${selected?.id === msg.id ? "bg-muted" : ""}`}
                      onClick={() => handleSelect(msg)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 shrink-0">
                          {msg.read ? (
                            <MailOpen className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Mail className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <p className={`text-sm truncate ${!msg.read ? "font-semibold" : ""}`}>
                              {msg.name}
                            </p>
                            {msg.repliedAt && (
                              <CheckCheck className="h-3 w-3 text-green-500 shrink-0" aria-label="Respondido" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{msg.subject}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Message detail + reply */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <Inbox className="h-12 w-12 opacity-30" />
              <p>Selecciona un mensaje para leerlo</p>
            </div>
          ) : (
            <>
              <CardHeader className="border-b py-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{selected.subject}</CardTitle>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {selected.name}
                      </span>
                      <a href={`mailto:${selected.email}`} className="flex items-center gap-1 hover:text-primary">
                        <Mail className="h-3.5 w-3.5" />
                        {selected.email}
                      </a>
                      {selected.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {selected.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(selected.createdAt)}
                      </span>
                    </div>
                  </div>
                  {selected.repliedAt && (
                    <Badge variant="secondary" className="shrink-0">
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Respondido
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-auto p-4 space-y-4">
                {/* Message body */}
                <div className="whitespace-pre-wrap text-sm leading-relaxed border rounded-md p-4 bg-muted/30">
                  {selected.message}
                </div>

                {/* Reply form */}
                <div className="space-y-2">
                  <label htmlFor="reply-textarea" className="text-sm font-medium flex items-center gap-1">
                    <Reply className="h-4 w-4" />
                    Responder a {selected.email}
                  </label>
                  <Textarea
                    id="reply-textarea"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escriba su respuesta aquí…"
                    rows={5}
                    className="resize-none"
                  />
                  <Button
                    onClick={handleReply}
                    disabled={!replyText.trim() || sending}
                    className="gap-2"
                  >
                    <Reply className="h-4 w-4" />
                    {sending ? "Enviando…" : "Enviar respuesta"}
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
