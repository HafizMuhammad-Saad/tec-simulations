import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'

const ChemicalReactions = () => {
    const navigate = useNavigate();
  return (
    <div>

    <div className='text-black w-full h-screen flex items-center justify-center text-3xl p-10'>
    <div className="flex flex-col items-center justify-center gap-10">
        <h1>    
      Coming Soon

        </h1>

    <div className="">

    <Button className='p-5 text-2xl font-semibold cursor-pointer' onClick={() => navigate('/')}>Back</Button>
    </div>
    </div>
    </div>
    </div>
  )
}

export default ChemicalReactions
