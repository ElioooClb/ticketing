type TicketOwner = {
  idCreateur: number;
};

type UserLite = {
  idUtilisateur: number;
  role: "admin" | "user";
};

export function canEditTicket(user: UserLite, ticket: TicketOwner): boolean {
  if (user.role === "admin") {
    return true;
  }
  return user.idUtilisateur === ticket.idCreateur;
}

export function canDeleteTicket(user: UserLite): boolean {
  return user.role === "admin";
}
