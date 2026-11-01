import { createContext,useContext,useEffect,useState,useCallback,useMemo } from 'react';
import { DEMO_UID } from '../demo/demoStore';
const Ctx=createContext(null);
const PROFILE_KEY='maja_fitness_demo_profile_en_v2';
const defaultGoal={
  age:28,gender:'female',height:168,weight:65,
  goal:'only_training',experience:'beginner',location:'home',
  activityLevel:'moderate',period:3,daysPerWeek:3,trainingDays:3,
  equipment:[],focusAreas:['legs','core','glutes']
};
const defaultDiet={diet:'none',allergies:[],dislikes:[]};
function saved(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY))||{}}catch{return {}}}
export function AuthProvider({children}){
  const [profile,setProfile]=useState(saved);
  const user=useMemo(()=>({uid:DEMO_UID,displayName:'Alex',email:null,emailVerified:true,providerData:[]}),[]);
  const userGoal=profile.goal??defaultGoal;
  const dietary=profile.dietary??defaultDiet;
  const savedRecipes=profile.savedRecipes??[];
  const musicConnections=profile.musicConnections??{};
  const save=(key,val)=>setProfile(prev=>({...prev,[key]:val}));
  useEffect(()=>{try{localStorage.setItem(PROFILE_KEY,JSON.stringify(profile))}catch{/* offline */}},[profile]);
  const saveGoal=async data=>{save('goal',data);return {ok:true}};
  const saveDietary=async data=>{save('dietary',data);return {ok:true}};
  const saveRecipe=async recipe=>{
    if(savedRecipes.some(r=>r.name===recipe.name))return {ok:false,reason:'exists'};
    save('savedRecipes',[...savedRecipes,{...recipe,savedAt:new Date().toISOString()}]);return {ok:true};
  };
  const removeRecipe=async name=>{save('savedRecipes',savedRecipes.filter(r=>r.name!==name));return {ok:true}};
  const upsertRecipe=async recipe=>{
    if(!recipe?.name)return {ok:false,reason:'missing_name'};
    const exists=savedRecipes.some(r=>r.name===recipe.name);
    save('savedRecipes',exists?savedRecipes.map(r=>r.name===recipe.name?{...r,...recipe}:r):[...savedRecipes,recipe]);
    return {ok:true,updated:exists};
  };
  const value={user,userGoal,dietary,savedRecipes,musicConnections,subscription:{tier:'premium'},
     isPremium:true,subscriptionTier:'premium',nutritionRecipeSlotsPerMeal:2,
     canChangeNutritionRecipes:true,isAdmin:false,loading:false,
     saveGoal,saveDietary,saveRecipe,removeRecipe,upsertRecipe,
     saveMusicConnections:async data=>{save('musicConnections',data);return {ok:true}},
     refreshUser:async()=>{},recheckAdmin:async()=>false,logout:()=>{}};
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useAuth(){const value=useContext(Ctx);if(!value)throw new Error('useAuth must be used within AuthProvider');return value}
