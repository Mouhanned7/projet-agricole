-- À exécuter APRÈS vous être inscrit sur le site avec votre adresse.
-- Remplacez l'adresse ci-dessous par la vôtre.
update profiles
   set roles = array_append(roles, 'admin'),
       email_verified_at = coalesce(email_verified_at, now())
 where id = (select id from auth.users where email = 'mouhanedmliki6@gmail.com.com')
   and not ('admin' = any (roles));

-- Vérification : doit afficher votre nom avec {…,admin}
select p.full_name, p.roles, u.email
  from profiles p join auth.users u on u.id = p.id
 where 'admin' = any (p.roles);
