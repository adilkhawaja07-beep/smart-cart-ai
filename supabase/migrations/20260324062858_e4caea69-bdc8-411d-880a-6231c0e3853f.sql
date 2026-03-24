
-- Allow public to insert into user_roles (so signup can self-assign admin)
CREATE POLICY "Authenticated users can insert own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
