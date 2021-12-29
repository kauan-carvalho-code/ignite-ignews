import { query as Q } from 'faunadb'
import { fauna } from '../../../services/fauna';

import NextAuth from 'next-auth';
import GithubProvider from "next-auth/providers/github";


export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'read:user',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile}) {
      const { email } = user
      
      try {
        await fauna.query(
          Q.If(
            Q.Not(
              Q.Exists(
                Q.Match(
                  Q.Index('user_by_email'),
                  Q.Casefold(user.email)
                )
              )
            ),
            Q.Create(
              Q.Collection('Users'),
              { data: { email }}
            ),
            Q.Get(
              Q.Match(
                Q.Index('user_by_email'),
                Q.Casefold(user.email)
              )
            )
          )
        )
        
        return true      
      } catch {
        return false
      }   
    },
  }
});