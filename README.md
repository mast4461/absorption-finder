# Absorption finder

An interactive tool for identifying the light absorption of a protein from
the output data of a particular experiment.

The tool fits a linear polynomial to the data. Subtracting this linear
polynomial from the data serves to remove the part of the absorption
that can be attributed to other things than the protein itself.

After subtraction the tool finds the maximum value in the modified data
and outputs its coordinates.