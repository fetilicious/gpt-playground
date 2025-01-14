import { Configuration, OpenAIApi } from "openai";
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { SimpleSequentialChain, LLMChain } from "langchain/chains";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured, please follow instructions in README.md",
      }
    });
    return;
  }

  const animal = req.body.animal || '';
  if (animal.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid animal",
      }
    });
    return;
  }

  const capitalizedAnimal =
    animal[0].toUpperCase() + animal.slice(1).toLowerCase();

  try {
    // const completion = await openai.createCompletion({
    //   model: "text-davinci-003",
    //   prompt: generatePrompt(animal),
    //   temperature: 0.6,
    // });

    const nameModel = new OpenAI({model_name : "text-davinci-003", temperature : 0.9});
    const nameChain = new LLMChain({ llm: nameModel, prompt: generateNameTemplate() });
    const storyModel = new OpenAI({model_name : "text-davinci-003", temperature : 0.9});
    const storyChain = new LLMChain({ llm: storyModel, prompt: generateStoryTemplate() });
    const overallChain = new SimpleSequentialChain({ chains: [nameChain, storyChain], verbose: true, });
    const chainResponse = await overallChain.run(capitalizedAnimal);
    res.status(200).json({result : chainResponse});
    // res.status(200).json({ result: completion.data.choices[0].text });
  } catch(error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: 'An error occurred during your request.',
        }
      });
    }
  }
}

function generateNameTemplate() {
  const animalNameTemplate = `Suggest three names for an animal that is a superhero.

Animal: Cat
Names: Captain Sharpclaw, Agent Fluffball, The Incredible Feline
Animal: Dog
Names: Ruff the Protector, Wonder Canine, Sir Barks-a-Lot
Animal: {animal}
Names:`;

  const prompt = new PromptTemplate({
    template : animalNameTemplate,
    inputVariables: ["animal"],
  });

  return prompt;
}

function generateStoryTemplate() {
  const storyTemplate = `You are a fiction author. Write a story about these superhero animals and their adventures to solve world peace. 
  
  Superhero animal names: 
  {names}`

  const prompt = new PromptTemplate({
    template : storyTemplate,
    inputVariables: ["names"],
  });

  return prompt;
}
