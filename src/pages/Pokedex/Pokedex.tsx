import { PokemonsList } from "../../components/PokemonsList";

const Pokedex: React.FC = () => {
    return (
        <div>Bienvenue dans le Pokedex
            <div>
                <PokemonsList></PokemonsList>
            </div>
        </div>)
};

export default Pokedex;