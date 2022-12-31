import { ref } from "vue";
import { supabase } from "../supabase";

export default function useUser() {
    const theUser = ref(null);

    const loadUser = () => {
        theUser.value = supabase.auth.user();
    };

    return { theUser, loadUser };
}